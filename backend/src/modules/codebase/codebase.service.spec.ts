import { Test, TestingModule } from '@nestjs/testing';
import { 
  CodebaseService, 
  GitMemberResolverService, 
  PathNotFoundError, 
  GitCommandError 
} from './codebase.service';
import { DRIZZLE } from '../../database/database.module';
import { execFile } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mocks complets des dépendances globales et modules natifs
jest.mock('child_process', () => ({
  execFile: jest.fn(),
}));
jest.mock('fs/promises', () => ({
  access: jest.fn(),
}));

describe('Codebase Services Module', () => {
  let codebaseService: CodebaseService;
  let resolverService: GitMemberResolverService;
  
  // Mock générique pour simuler la structure chaînable de Drizzle ORM
  const mockDbBuilder = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  // Mock pour les transactions Drizzle complexes (tx.select, tx.delete, tx.insert)
  const mockTx = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    onConflictDoUpdate: jest.fn().mockResolvedValue(true),
  };

  const mockDb = {
    ...mockDbBuilder,
    transaction: jest.fn((cb) => cb(mockTx)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodebaseService,
        GitMemberResolverService,
        {
          provide: DRIZZLE,
          useValue: mockDb,
        },
      ],
    }).compile();

    codebaseService = module.get<CodebaseService>(CodebaseService);
    resolverService = module.get<GitMemberResolverService>(GitMemberResolverService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CodebaseService', () => {
    const repoRoot = '/mock/repo/root';
    const targetPath = 'src/main.ts';

    describe('analyzeOwnership', () => {
      
      it('Cas 1 : Devrait lever une PathNotFoundError si le fichier n\'existe pas', async () => {
        (fs.access as jest.Mock).mockRejectedValueOnce(new Error('ENOENT'));

        await expect(
          codebaseService.analyzeOwnership(repoRoot, targetPath)
        ).rejects.toThrow(PathNotFoundError);
      });

      it('Cas 2 : Devrait lever une GitCommandError si la commande git log échoue', async () => {
        (fs.access as jest.Mock).mockResolvedValueOnce(undefined);
        
        // Simule un échec de la commande native git execFile
        const execFileMock = require('child_process').execFile;
        execFileMock.mockImplementationOnce((cmd: string, args: any[], opts: any, cb: any) => {
          cb(new Error('Fatal: not a git repository'), null, null);
        });

        await expect(
          codebaseService.analyzeOwnership(repoRoot, targetPath)
        ).rejects.toThrow(GitCommandError);
      });

      it('Cas 3 : Devrait retourner un résultat vide si aucun commit n\'est trouvé', async () => {
        (fs.access as jest.Mock).mockResolvedValueOnce(undefined);
        
        const execFileMock = require('child_process').execFile;
        execFileMock.mockImplementationOnce((cmd: string, args: any[], opts: any, cb: any) => {
          cb(null, { stdout: '' }, null); // Aucun commit sorti
        });

        const result = await codebaseService.analyzeOwnership(repoRoot, targetPath);

        expect(result.contributors).toEqual([]);
        expect(result.filePath).toBe(targetPath);
      });

      it('Cas 4 : Devrait calculer l\'ownership pondéré (demi-vie) et exécuter l\'upsert Drizzle', async () => {
        (fs.access as jest.Mock).mockResolvedValueOnce(undefined);

        const nowIso = new Date().toISOString();
        const oldIso = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(); // 180 jours (exactement 1 demi-vie)

        // Génère un flux conforme avec le séparateur \x00
        const gitStdout = `Lyes Djaoui\x00${nowIso}\nDev Ancien\x00${oldIso}\n`;
        
        const execFileMock = require('child_process').execFile;
        execFileMock.mockImplementationOnce((cmd: string, args: any[], opts: any, cb: any) => {
          cb(null, { stdout: gitStdout }, null);
        });

        // Config de la transaction : simuler un historique vide en base pour ce fichier
        mockTx.select.mockImplementationOnce(() => ({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([]), // Aucun ancien contributeur à clean
        }));

        const result = await codebaseService.analyzeOwnership(repoRoot, targetPath);

        expect(result.contributors.length).toBe(2);
        expect(result.contributors[0].contributorName).toBe('Lyes Djaoui');
        
        // Mathématiques du calcul : Lyes = 1 point (récent), Dev Ancien = 0.5 point (1 demi-vie). 
        // Total = 1.5. Lyes % = (1 / 1.5) * 100 ≈ 66.67%
        expect(result.contributors[0].weightPercentage).toBe(66.67);
        expect(result.contributors[1].weightPercentage).toBe(33.33);

        // Vérification de l'upsert Drizzle
        expect(mockDb.transaction).toHaveBeenCalled();
        expect(mockTx.insert).toHaveBeenCalled();
      });

      it('Cas 5 : Devrait nettoyer les anciens contributeurs obsolètes de la base de données', async () => {
        (fs.access as jest.Mock).mockResolvedValueOnce(undefined);

        const gitStdout = `Lyes Djaoui\x00${new Date().toISOString()}\n`;
        const execFileMock = require('child_process').execFile;
        execFileMock.mockImplementationOnce((cmd: string, args: any[], opts: any, cb: any) => {
          cb(null, { stdout: gitStdout }, null);
        });

        // La base de données contient "AncienDev" qui n'est plus dans l'historique Git actuel
        mockTx.select.mockImplementationOnce(() => ({
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([{ contributorName: 'AncienDev' }]),
        }));

        await codebaseService.analyzeOwnership(repoRoot, targetPath);

        expect(mockTx.delete).toHaveBeenCalled();
      });
    });

    describe('getStoredOwnership & getPrimaryOwner', () => {
      it('Devrait retourner les lignes brutes triées pour getStoredOwnership', async () => {
        const mockRows = [{ filePath: targetPath, contributorName: 'Lyes', weightPercentage: 100 }];
        mockDb.execute.mockResolvedValueOnce(mockRows);
        mockDb.orderBy.mockResolvedValueOnce(mockRows);

        const res = await codebaseService.getStoredOwnership(targetPath);
        expect(res).toEqual(mockRows);
      });

      it('Devrait extraire le premier élément ou null pour getPrimaryOwner', async () => {
        mockDb.limit.mockResolvedValueOnce([]); // Tableau vide renvoyé par la base
        const resNull = await codebaseService.getPrimaryOwner(targetPath);
        expect(resNull).toBeNull();

        const mockRows = [{ contributorName: 'Lyes', weightPercentage: 85 }];
        mockDb.limit.mockResolvedValueOnce(mockRows);
        const resOwner = await codebaseService.getPrimaryOwner(targetPath);
        expect(resOwner).toEqual(mockRows[0]);
      });
    });
  });

  describe('GitMemberResolverService', () => {
    it('Cas 1 : Devrait immédiatement retourner un tableau vide si aucun contributeur fourni', async () => {
      const res = await resolverService.resolveMembers([]);
      expect(res).toEqual([]);
    });

    it('Cas 2 : Devrait matcher les membres par gitName ou name (Insensible à la casse)', async () => {
      const contributors = [
        { contributorName: 'lyes djaoui', weightPercentage: 70 },
        { contributorName: 'Inconnu', weightPercentage: 30 }
      ];

      const mockDbMembers = [
        { id: 1, name: 'Lyes Djaoui', email: 'lyes@dispatch.com', gitName: 'lyes djaoui' }
      ];

      mockDb.execute.mockResolvedValueOnce(mockDbMembers);
      mockDb.where.mockResolvedValueOnce(mockDbMembers);

      const result = await resolverService.resolveMembers(contributors);

      expect(result.length).toBe(2);
      // "lyes djaoui" doit être rattaché au membre id: 1
      expect(result[0].member).not.toBeNull();
      expect(result[0].member?.id).toBe(1);
      // "Inconnu" doit rester à null
      expect(result[1].member).toBeNull();
    });
  });
});
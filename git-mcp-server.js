#!/usr/bin/env node

// This is an MCP server for Git operations
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

// Parse command line arguments
const args = process.argv.slice(2);
const accessTokenIndex = args.indexOf('--access-token');
const GITHUB_TOKEN = accessTokenIndex !== -1 ? args[accessTokenIndex + 1] : process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('Error: GitHub Personal Access Token is required.');
  console.error('Provide it using --access-token <token> or GITHUB_PERSONAL_ACCESS_TOKEN environment variable.');
  process.exit(1);
}

// Promisify exec for async/await usage
const exec = promisify(execCallback);

class GitServer {
  constructor() {
    this.server = new Server(
      {
        name: 'git-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Git Tools
        {
          name: 'git_status',
          description: 'Check the status of a Git repository',
          inputSchema: {
            type: 'object',
            properties: {
              repositoryPath: {
                type: 'string',
                description: 'Path to the Git repository'
              }
            },
            required: ['repositoryPath']
          }
        },
        {
          name: 'git_commit',
          description: 'Commit changes to a Git repository',
          inputSchema: {
            type: 'object',
            properties: {
              repositoryPath: {
                type: 'string',
                description: 'Path to the Git repository'
              },
              message: {
                type: 'string',
                description: 'Commit message'
              },
              files: {
                type: 'array',
                items: { type: 'string' },
                description: 'Files to commit (empty for all staged files)'
              }
            },
            required: ['repositoryPath', 'message']
          }
        },
        {
          name: 'git_add',
          description: 'Stage files for commit',
          inputSchema: {
            type: 'object',
            properties: {
              repositoryPath: {
                type: 'string',
                description: 'Path to the Git repository'
              },
              files: {
                type: 'array',
                items: { type: 'string' },
                description: 'Files to stage (empty for all files)'
              }
            },
            required: ['repositoryPath']
          }
        },
        {
          name: 'git_branch',
          description: 'List, create, or switch branches',
          inputSchema: {
            type: 'object',
            properties: {
              repositoryPath: {
                type: 'string',
                description: 'Path to the Git repository'
              },
              operation: {
                type: 'string',
                description: 'Branch operation: list, create, or switch',
                enum: ['list', 'create', 'switch']
              },
              branchName: {
                type: 'string',
                description: 'Name of the branch (for create/switch operations)'
              }
            },
            required: ['repositoryPath', 'operation']
          }
        },
        {
          name: 'git_push',
          description: 'Push commits to a remote repository',
          inputSchema: {
            type: 'object',
            properties: {
              repositoryPath: {
                type: 'string',
                description: 'Path to the Git repository'
              },
              remote: {
                type: 'string',
                description: 'Remote name',
                default: 'origin'
              },
              branch: {
                type: 'string',
                description: 'Branch to push'
              }
            },
            required: ['repositoryPath']
          }
        },
        {
          name: 'git_pull',
          description: 'Pull changes from a remote repository',
          inputSchema: {
            type: 'object',
            properties: {
              repositoryPath: {
                type: 'string',
                description: 'Path to the Git repository'
              },
              remote: {
                type: 'string',
                description: 'Remote name',
                default: 'origin'
              },
              branch: {
                type: 'string',
                description: 'Branch to pull'
              }
            },
            required: ['repositoryPath']
          }
        },
        {
          name: 'git_remote',
          description: 'Manage Git remotes',
          inputSchema: {
            type: 'object',
            properties: {
              repositoryPath: {
                type: 'string',
                description: 'Path to the Git repository'
              },
              operation: {
                type: 'string',
                description: 'Remote operation: list, add, remove',
                enum: ['list', 'add', 'remove']
              },
              name: {
                type: 'string',
                description: 'Remote name (for add/remove operations)'
              },
              url: {
                type: 'string',
                description: 'Remote URL (for add operation)'
              }
            },
            required: ['repositoryPath', 'operation']
          }
        },
        {
          name: 'create_github_repo',
          description: 'Create a new GitHub repository and set it as a remote',
          inputSchema: {
            type: 'object',
            properties: {
              repositoryPath: {
                type: 'string',
                description: 'Path to the Git repository'
              },
              name: {
                type: 'string',
                description: 'Name of the GitHub repository'
              },
              description: {
                type: 'string',
                description: 'Description of the GitHub repository'
              },
              private: {
                type: 'boolean',
                description: 'Whether the repository should be private'
              }
            },
            required: ['repositoryPath', 'name']
          }
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          // Git Tools
          case 'git_status':
            return await this.handleGitStatus(request.params.arguments);
          case 'git_commit':
            return await this.handleGitCommit(request.params.arguments);
          case 'git_add':
            return await this.handleGitAdd(request.params.arguments);
          case 'git_branch':
            return await this.handleGitBranch(request.params.arguments);
          case 'git_push':
            return await this.handleGitPush(request.params.arguments);
          case 'git_pull':
            return await this.handleGitPull(request.params.arguments);
          case 'git_remote':
            return await this.handleGitRemote(request.params.arguments);
          case 'create_github_repo':
            return await this.handleCreateGithubRepo(request.params.arguments);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        console.error(`Error in ${request.params.name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  // Git Handler Methods
  async handleGitStatus(args) {
    if (!args?.repositoryPath) {
      throw new McpError(ErrorCode.InvalidParams, 'Repository path is required');
    }

    try {
      const { stdout, stderr } = await exec(`git -C "${args.repositoryPath}" status`);
      
      if (stderr) {
        return {
          content: [
            {
              type: 'text',
              text: stderr,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: stdout,
          },
        ],
      };
    } catch (error) {
      const err = error;
      throw new McpError(
        ErrorCode.InternalError,
        `Git error: ${err.stderr || err.message}`
      );
    }
  }

  async handleGitCommit(args) {
    if (!args?.repositoryPath || !args?.message) {
      throw new McpError(ErrorCode.InvalidParams, 'Repository path and commit message are required');
    }

    try {
      let command = `git -C "${args.repositoryPath}" commit -m "${args.message}"`;
      
      // If specific files are provided, add them to the command
      if (args.files && Array.isArray(args.files) && args.files.length > 0) {
        command += ' -- ' + args.files.map((file) => `"${file}"`).join(' ');
      }
      
      const { stdout, stderr } = await exec(command);
      
      if (stderr && !stderr.includes('create mode') && !stderr.includes('file changed')) {
        return {
          content: [
            {
              type: 'text',
              text: stderr,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: stdout || stderr || 'Commit successful',
          },
        ],
      };
    } catch (error) {
      const err = error;
      throw new McpError(
        ErrorCode.InternalError,
        `Git error: ${err.stderr || err.message}`
      );
    }
  }

  async handleGitAdd(args) {
    if (!args?.repositoryPath) {
      throw new McpError(ErrorCode.InvalidParams, 'Repository path is required');
    }

    try {
      let command = `git -C "${args.repositoryPath}" add`;
      
      // If specific files are provided, add them to the command, otherwise add all
      if (args.files && Array.isArray(args.files) && args.files.length > 0) {
        command += ' ' + args.files.map((file) => `"${file}"`).join(' ');
      } else {
        command += ' .';
      }
      
      const { stdout, stderr } = await exec(command);
      
      if (stderr) {
        return {
          content: [
            {
              type: 'text',
              text: stderr,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: stdout || 'Files staged successfully',
          },
        ],
      };
    } catch (error) {
      const err = error;
      throw new McpError(
        ErrorCode.InternalError,
        `Git error: ${err.stderr || err.message}`
      );
    }
  }

  async handleGitBranch(args) {
    if (!args?.repositoryPath || !args?.operation) {
      throw new McpError(ErrorCode.InvalidParams, 'Repository path and operation are required');
    }

    try {
      let command;
      
      switch (args.operation) {
        case 'list':
          command = `git -C "${args.repositoryPath}" branch`;
          break;
        case 'create':
          if (!args.branchName) {
            throw new McpError(ErrorCode.InvalidParams, 'Branch name is required for create operation');
          }
          command = `git -C "${args.repositoryPath}" branch "${args.branchName}"`;
          break;
        case 'switch':
          if (!args.branchName) {
            throw new McpError(ErrorCode.InvalidParams, 'Branch name is required for switch operation');
          }
          command = `git -C "${args.repositoryPath}" checkout "${args.branchName}"`;
          break;
        default:
          throw new McpError(ErrorCode.InvalidParams, 'Invalid branch operation');
      }
      
      const { stdout, stderr } = await exec(command);
      
      if (stderr && !stderr.includes('Switched to branch')) {
        return {
          content: [
            {
              type: 'text',
              text: stderr,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: stdout || stderr || `Branch operation '${args.operation}' successful`,
          },
        ],
      };
    } catch (error) {
      const err = error;
      throw new McpError(
        ErrorCode.InternalError,
        `Git error: ${err.stderr || err.message}`
      );
    }
  }

  async handleGitPush(args) {
    if (!args?.repositoryPath) {
      throw new McpError(ErrorCode.InvalidParams, 'Repository path is required');
    }

    try {
      const remote = args.remote || 'origin';
      const branch = args.branch ? `${remote} ${args.branch}` : remote;
      
      const { stdout, stderr } = await exec(`git -C "${args.repositoryPath}" push ${branch}`);
      
      // Git push outputs progress to stderr, so we need to check for specific error patterns
      if (stderr && !stderr.includes('->') && stderr.includes('error:')) {
        return {
          content: [
            {
              type: 'text',
              text: stderr,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: stdout || stderr || 'Push successful',
          },
        ],
      };
    } catch (error) {
      const err = error;
      throw new McpError(
        ErrorCode.InternalError,
        `Git error: ${err.stderr || err.message}`
      );
    }
  }

  async handleGitPull(args) {
    if (!args?.repositoryPath) {
      throw new McpError(ErrorCode.InvalidParams, 'Repository path is required');
    }

    try {
      const remote = args.remote || 'origin';
      const branch = args.branch ? `${remote} ${args.branch}` : '';
      
      const { stdout, stderr } = await exec(`git -C "${args.repositoryPath}" pull ${branch}`);
      
      // Git pull might output information to stderr that's not an error
      if (stderr && stderr.includes('error:')) {
        return {
          content: [
            {
              type: 'text',
              text: stderr,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: stdout || stderr || 'Pull successful',
          },
        ],
      };
    } catch (error) {
      const err = error;
      throw new McpError(
        ErrorCode.InternalError,
        `Git error: ${err.stderr || err.message}`
      );
    }
  }

  async handleGitRemote(args) {
    if (!args?.repositoryPath || !args?.operation) {
      throw new McpError(ErrorCode.InvalidParams, 'Repository path and operation are required');
    }

    try {
      let command;
      
      switch (args.operation) {
        case 'list':
          command = `git -C "${args.repositoryPath}" remote -v`;
          break;
        case 'add':
          if (!args.name || !args.url) {
            throw new McpError(ErrorCode.InvalidParams, 'Remote name and URL are required for add operation');
          }
          command = `git -C "${args.repositoryPath}" remote add "${args.name}" "${args.url}"`;
          break;
        case 'remove':
          if (!args.name) {
            throw new McpError(ErrorCode.InvalidParams, 'Remote name is required for remove operation');
          }
          command = `git -C "${args.repositoryPath}" remote remove "${args.name}"`;
          break;
        default:
          throw new McpError(ErrorCode.InvalidParams, 'Invalid remote operation');
      }
      
      const { stdout, stderr } = await exec(command);
      
      if (stderr) {
        return {
          content: [
            {
              type: 'text',
              text: stderr,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: stdout || `Remote operation '${args.operation}' successful`,
          },
        ],
      };
    } catch (error) {
      const err = error;
      throw new McpError(
        ErrorCode.InternalError,
        `Git error: ${err.stderr || err.message}`
      );
    }
  }

  async handleCreateGithubRepo(args) {
    if (!args?.repositoryPath || !args?.name) {
      throw new McpError(ErrorCode.InvalidParams, 'Repository path and repository name are required');
    }

    try {
      // Check if gh CLI is installed
      try {
        await exec('gh --version');
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: 'GitHub CLI (gh) is not installed. Please install it first or create the repository manually.',
            },
          ],
          isError: true,
        };
      }

      // Create GitHub repository
      const visibility = args.private ? '--private' : '--public';
      const description = args.description ? `--description "${args.description}"` : '';
      
      const { stdout: repoOutput, stderr: repoError } = await exec(
        `gh repo create "${args.name}" ${visibility} ${description} --source="${args.repositoryPath}" --remote=origin --push`
      );
      
      if (repoError && repoError.toLowerCase().includes('error')) {
        return {
          content: [
            {
              type: 'text',
              text: repoError,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: repoOutput || 'GitHub repository created and code pushed successfully',
          },
        ],
      };
    } catch (error) {
      const err = error;
      throw new McpError(
        ErrorCode.InternalError,
        `GitHub error: ${err.stderr || err.message}`
      );
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Git MCP server running on stdio');
  }
}

const server = new GitServer();
server.run().catch(console.error);

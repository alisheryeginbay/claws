import { VirtualFS } from './VirtualFS';
import { EventBus } from '@/engine/EventBus';
import { formatBytes } from '@/lib/utils';

interface CommandResult {
  output: string;
  isError?: boolean;
  newCwd?: string;
  sideEffects?: {
    cpuCost?: number;
    memoryCost?: number;
    networkCost?: number;
    diskCost?: number;
  };
}

type CommandHandler = (args: string[], cwd: string) => CommandResult;

const commands: Record<string, CommandHandler> = {
  ls: (args, cwd) => {
    const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al');
    const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al');
    const target = args.find((a) => !a.startsWith('-')) || '.';
    const path = target === '.' ? cwd : target;

    const items = VirtualFS.listDir(path, cwd, showHidden);
    if (items.length === 0 && !VirtualFS.isDirectory(path, cwd)) {
      return { output: `ls: cannot access '${target}': No such file or directory`, isError: true };
    }

    if (showLong) {
      const lines = items.map((item) => {
        const typeChar = item.type === 'directory' ? 'd' : '-';
        const size = item.size.toString().padStart(8);
        const name = item.type === 'directory'
          ? `\x1b[34m${item.name}/\x1b[0m`
          : item.name.endsWith('.js') || item.name.endsWith('.ts') || item.name.endsWith('.py')
            ? `\x1b[32m${item.name}\x1b[0m`
            : item.name;
        return `${typeChar}${item.permissions}  ${size}  ${name}`;
      });
      return { output: lines.join('\n') };
    }

    const names = items.map((item) =>
      item.type === 'directory' ? `\x1b[34m${item.name}/\x1b[0m` : item.name
    );
    return { output: names.join('  ') };
  },

  cd: (args, cwd) => {
    const target = args[0] || '/home/user';
    const resolved = VirtualFS.resolve(target, cwd);

    if (!VirtualFS.exists(resolved, '/')) {
      return { output: `cd: no such file or directory: ${target}`, isError: true };
    }
    if (!VirtualFS.isDirectory(resolved, '/')) {
      return { output: `cd: not a directory: ${target}`, isError: true };
    }
    return { output: '', newCwd: resolved };
  },

  pwd: (_args, cwd) => {
    return { output: cwd };
  },

  cat: (args, cwd) => {
    if (args.length === 0) return { output: 'cat: missing file operand', isError: true };

    const results: string[] = [];
    for (const arg of args) {
      const content = VirtualFS.readFile(arg, cwd);
      if (content === null) {
        return { output: `cat: ${arg}: No such file or directory`, isError: true };
      }
      results.push(content);
    }
    return { output: results.join('\n') };
  },

  head: (args, cwd) => {
    let lines = 10;
    const filtered = args.filter((a) => {
      if (a.startsWith('-n')) { lines = parseInt(a.slice(2)) || 10; return false; }
      if (a.startsWith('-') && !isNaN(parseInt(a.slice(1)))) { lines = parseInt(a.slice(1)); return false; }
      return true;
    });
    if (filtered.length === 0) return { output: 'head: missing file operand', isError: true };
    const content = VirtualFS.readFile(filtered[0], cwd);
    if (content === null) return { output: `head: ${filtered[0]}: No such file or directory`, isError: true };
    return { output: content.split('\n').slice(0, lines).join('\n') };
  },

  tail: (args, cwd) => {
    let lines = 10;
    const filtered = args.filter((a) => {
      if (a.startsWith('-n')) { lines = parseInt(a.slice(2)) || 10; return false; }
      if (a.startsWith('-') && !isNaN(parseInt(a.slice(1)))) { lines = parseInt(a.slice(1)); return false; }
      return true;
    });
    if (filtered.length === 0) return { output: 'tail: missing file operand', isError: true };
    const content = VirtualFS.readFile(filtered[0], cwd);
    if (content === null) return { output: `tail: ${filtered[0]}: No such file or directory`, isError: true };
    return { output: content.split('\n').slice(-lines).join('\n') };
  },

  mkdir: (args, cwd) => {
    if (args.length === 0) return { output: 'mkdir: missing operand', isError: true };
    for (const arg of args) {
      if (!VirtualFS.mkdir(arg, cwd)) {
        return { output: `mkdir: cannot create directory '${arg}': File exists or parent not found`, isError: true };
      }
    }
    return { output: '' };
  },

  touch: (args, cwd) => {
    if (args.length === 0) return { output: 'touch: missing file operand', isError: true };
    for (const arg of args) {
      if (!VirtualFS.exists(arg, cwd)) {
        VirtualFS.writeFile(arg, '', cwd);
      }
    }
    return { output: '' };
  },

  rm: (args, cwd) => {
    const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr');
    const force = args.includes('-f') || args.includes('-rf') || args.includes('-fr');
    const targets = args.filter((a) => !a.startsWith('-'));

    if (targets.length === 0) return { output: 'rm: missing operand', isError: true };

    // Check for dangerous patterns
    for (const target of targets) {
      const resolved = VirtualFS.resolve(target, cwd);
      if (resolved === '/' || resolved === '/home' || resolved === '/home/user') {
        EventBus.emit('security_violation', {
          type: 'dangerous_command',
          detail: `rm ${args.join(' ')} targeting ${resolved}`,
        });
        return {
          output: `\x1b[31m⚠ SYSTEM ALERT: Dangerous operation blocked!\x1b[0m\nAttempted to remove critical path: ${resolved}`,
          isError: true,
          sideEffects: { cpuCost: 5 },
        };
      }
    }

    for (const target of targets) {
      if (!VirtualFS.remove(target, cwd, recursive)) {
        if (!force) {
          return { output: `rm: cannot remove '${target}': No such file or directory or directory not empty`, isError: true };
        }
      }
    }
    return { output: '', sideEffects: { diskCost: -2 } };
  },

  cp: (args, cwd) => {
    const targets = args.filter((a) => !a.startsWith('-'));
    if (targets.length < 2) return { output: 'cp: missing destination', isError: true };
    const src = targets[0];
    const dest = targets[1];
    if (!VirtualFS.copy(src, dest, cwd)) {
      return { output: `cp: cannot copy '${src}': No such file or not a regular file`, isError: true };
    }
    return { output: '', sideEffects: { diskCost: 1 } };
  },

  mv: (args, cwd) => {
    if (args.length < 2) return { output: 'mv: missing destination', isError: true };
    if (!VirtualFS.move(args[0], args[1], cwd)) {
      return { output: `mv: cannot move '${args[0]}'`, isError: true };
    }
    return { output: '' };
  },

  grep: (args, cwd) => {
    const flags = args.filter((a) => a.startsWith('-'));
    const positional = args.filter((a) => !a.startsWith('-'));
    if (positional.length < 1) return { output: 'grep: missing pattern', isError: true };

    const pattern = positional[0];
    const target = positional[1] || cwd;
    const caseInsensitive = flags.includes('-i');
    const results = VirtualFS.grep(pattern, target, cwd);

    if (results.length === 0) return { output: '' };

    const lines = results.map((r) => {
      const displayPath = r.path.replace(/^\/home\/user\//, '');
      return `\x1b[35m${displayPath}\x1b[0m:\x1b[33m${r.line}\x1b[0m: ${r.text}`;
    });
    return { output: lines.join('\n'), sideEffects: { cpuCost: 3 } };
  },

  echo: (args) => {
    return { output: args.join(' ').replace(/^["']|["']$/g, '') };
  },

  clear: () => {
    EventBus.emit('terminal_clear');
    return { output: '' };
  },

  whoami: () => ({ output: 'clawback-ai' }),

  hostname: () => ({ output: 'claw-workstation' }),

  date: () => {
    return { output: new Date().toLocaleString() };
  },

  uname: (args) => {
    if (args.includes('-a')) {
      return { output: 'Claws 6.1.0 claw-workstation x86_64 GNU/Linux' };
    }
    return { output: 'Claws' };
  },

  wc: (args, cwd) => {
    const target = args.find((a) => !a.startsWith('-'));
    if (!target) return { output: 'wc: missing operand', isError: true };
    const content = VirtualFS.readFile(target, cwd);
    if (content === null) return { output: `wc: ${target}: No such file`, isError: true };
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).filter(Boolean).length;
    const chars = content.length;
    return { output: `  ${lines}  ${words}  ${chars} ${target}` };
  },

  du: (args, cwd) => {
    const target = args[0] || cwd;
    const node = VirtualFS.getNode(target, cwd);
    if (!node) return { output: `du: ${target}: No such file or directory`, isError: true };

    let total = 0;
    const countSize = (n: typeof node) => {
      total += n.size;
      n.children?.forEach(countSize);
    };
    countSize(node);
    return { output: `${formatBytes(total)}\t${target}` };
  },

  chmod: (args, cwd) => {
    if (args.length < 2) return { output: 'chmod: missing operand', isError: true };
    const node = VirtualFS.getNode(args[1], cwd);
    if (!node) return { output: `chmod: ${args[1]}: No such file or directory`, isError: true };
    // Simplified: just acknowledge
    return { output: '' };
  },

  curl: (args) => {
    const url = args.find((a) => !a.startsWith('-'));
    if (!url) return { output: 'curl: missing URL', isError: true };
    return {
      output: `  % Total    % Received\n  100  1024  100  1024    0     0   2048      0 --:--:-- --:--:-- --:--:--  2048\n{"status": "ok", "message": "simulated response from ${url}"}`,
      sideEffects: { networkCost: 10, cpuCost: 2 },
    };
  },

  wget: (args) => {
    const url = args.find((a) => !a.startsWith('-'));
    if (!url) return { output: 'wget: missing URL', isError: true };
    return {
      output: `--2024-01-15 10:00:00--  ${url}\nResolving... connected.\nHTTP request sent, awaiting response... 200 OK\nSaving to: 'downloaded_file'\ndownloaded_file  100%[======>]  1.2K  --.-KB/s  in 0s\n\n'downloaded_file' saved [1234]`,
      sideEffects: { networkCost: 15, diskCost: 1 },
    };
  },

  git: (args) => {
    const sub = args[0];
    switch (sub) {
      case 'status':
        return { output: 'On branch main\nnothing to commit, working tree clean' };
      case 'log':
        return {
          output: `commit a1b2c3d (HEAD -> main)\nAuthor: Dev Dan <dan@company.com>\nDate:   Mon Jan 15 09:00:00 2024\n\n    fix: resolve auth token refresh issue\n\ncommit e4f5g6h\nAuthor: Raj <raj@company.com>\nDate:   Fri Jan 12 16:30:00 2024\n\n    feat: add monitoring dashboard\n\ncommit i7j8k9l\nAuthor: Dev Dan <dan@company.com>\nDate:   Thu Jan 11 14:00:00 2024\n\n    refactor: migrate to new API client`,
        };
      case 'diff':
        return { output: 'No changes detected.' };
      case 'branch':
        return { output: '* main\n  develop\n  feature/auth-refactor' };
      default:
        return { output: `git: '${sub || ''}' requires additional arguments` };
    }
  },

  npm: (args) => {
    const sub = args[0];
    switch (sub) {
      case 'install':
        return {
          output: 'added 127 packages in 3.2s\n\n12 packages are looking for funding\n  run `npm fund` for details',
          sideEffects: { cpuCost: 15, networkCost: 20, diskCost: 5 },
        };
      case 'run':
        return { output: `> ${args[1] || 'start'}\n\nServer running on http://localhost:3000`, sideEffects: { cpuCost: 10 } };
      case 'test':
        return {
          output: '> test\n\nPASS  src/app.test.js\n  ✓ renders homepage (12ms)\n  ✓ handles login (23ms)\n  ✓ displays user data (8ms)\n\nTests: 3 passed, 3 total\nTime:  1.234s',
          sideEffects: { cpuCost: 12 },
        };
      default:
        return { output: `npm: unknown command '${sub || ''}'` };
    }
  },

  python: (args, cwd) => {
    if (args.length === 0) {
      return { output: 'Python 3.12.0\nType "exit()" to exit.\n>>> (interactive mode not supported)', sideEffects: { cpuCost: 5 } };
    }
    const file = args[0];
    if (!VirtualFS.exists(file, cwd)) {
      return { output: `python: can't open file '${file}': No such file`, isError: true };
    }
    return {
      output: `Running ${file}...\n[Simulated execution output]\nProcess completed successfully.`,
      sideEffects: { cpuCost: 8, memoryCost: 5 },
    };
  },

  node: (args) => {
    if (args.length === 0) {
      return { output: 'Welcome to Node.js v20.0.0\n> (interactive mode not supported)' };
    }
    return {
      output: `Running ${args[0]}...\n[Simulated execution output]\nProcess completed successfully.`,
      sideEffects: { cpuCost: 8, memoryCost: 5 },
    };
  },

  find: (args, cwd) => {
    const target = args[0] || cwd;
    const nameFlag = args.indexOf('-name');
    const pattern = nameFlag >= 0 ? args[nameFlag + 1] : null;

    const results: string[] = [];
    const searchNode = (node: ReturnType<typeof VirtualFS.getNode>) => {
      if (!node) return;
      if (pattern) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
        if (regex.test(node.name)) {
          results.push(node.path);
        }
      } else {
        results.push(node.path);
      }
      if (node.children) {
        for (const child of node.children) {
          searchNode(child);
        }
      }
    };

    const startNode = VirtualFS.getNode(target, cwd);
    if (!startNode) return { output: `find: '${target}': No such file or directory`, isError: true };
    searchNode(startNode);
    return { output: results.join('\n') };
  },

  help: () => ({
    output: `Available commands:
  ls, cd, pwd, cat, head, tail, mkdir, touch, rm, cp, mv
  grep, echo, clear, whoami, hostname, date, uname, wc, du
  chmod, curl, wget, git, npm, python, node, find, help`,
  }),
};

export function executeCommand(input: string, cwd: string): CommandResult {
  const trimmed = input.trim();
  if (!trimmed) return { output: '' };

  // Handle pipe (simplified: just run last command)
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map((p) => p.trim());
    // Execute first command, use output as context
    const firstResult = executeCommand(parts[0], cwd);
    // For now, just return combined output
    return firstResult;
  }

  // Handle redirects (simplified)
  let actualCmd = trimmed;
  let redirectFile: string | null = null;
  let appendMode = false;

  if (trimmed.includes('>>')) {
    const parts = trimmed.split('>>');
    actualCmd = parts[0].trim();
    redirectFile = parts[1].trim();
    appendMode = true;
  } else if (trimmed.includes('>')) {
    const parts = trimmed.split('>');
    actualCmd = parts[0].trim();
    redirectFile = parts[1].trim();
  }

  // Parse command and args
  const tokens = parseTokens(actualCmd);
  if (tokens.length === 0) return { output: '' };

  const cmd = tokens[0];
  const args = tokens.slice(1);

  // Check for dangerous patterns
  if (cmd === 'rm' && (args.includes('-rf') || args.includes('-fr')) && args.some((a) => a === '/' || a === '/*')) {
    EventBus.emit('security_violation', {
      type: 'dangerous_command',
      detail: `rm -rf ${args.join(' ')}`,
    });
    return {
      output: '\x1b[31m⚠ CRITICAL SYSTEM ALERT ⚠\x1b[0m\n\nDangerous command detected and blocked!\nAttempting to destroy the filesystem is a serious security violation.',
      isError: true,
      sideEffects: { cpuCost: 5 },
    };
  }

  const handler = commands[cmd];
  if (!handler) {
    return { output: `${cmd}: command not found`, isError: true };
  }

  const result = handler(args, cwd);

  // Handle redirect
  if (redirectFile && result.output) {
    const existing = appendMode ? (VirtualFS.readFile(redirectFile, cwd) || '') : '';
    const content = appendMode ? existing + '\n' + result.output : result.output;
    VirtualFS.writeFile(redirectFile, content, cwd);
    return { ...result, output: '' };
  }

  return result;
}

function parseTokens(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote: string | null = null;

  for (const char of input) {
    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = char;
    } else if (char === ' ' || char === '\t') {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

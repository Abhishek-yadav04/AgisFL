# AgisFL CLI Access Scripts

This directory contains scripts to easily access and use the AgisFL CLI (Command Line Interface) tools.

## Available Scripts

### 1. `agis-cli.bat` (Windows Batch Script)
- **Purpose**: Quick launcher for the AgisFL CLI
- **Usage**: `.\agis-cli.bat [command] [options]`
- **Example**:
  ```batch
  .\agis-cli.bat experiment list
  .\agis-cli.bat monitor dashboard
  .\agis-cli.bat simulation run --attack poisoning
  ```

### 2. `agis-cli.ps1` (PowerShell Script)
- **Purpose**: PowerShell version of the CLI launcher
- **Usage**: `.\agis-cli.ps1 [command] [options]`
- **Example**:
  ```powershell
  .\agis-cli.ps1 experiment list
  .\agis-cli.ps1 monitor dashboard
  .\agis-cli.ps1 simulation run --attack poisoning
  ```

### 3. `setup-cli.bat` (Setup Script)
- **Purpose**: Configure the CLI for first-time use
- **Usage**: `.\setup-cli.bat`
- **What it does**:
  - Sets the server URL to `http://localhost:8000`
  - Prompts for API key configuration
  - Shows usage examples

## Prerequisites

1. **Python 3.8+** installed and in PATH
2. **AgisFL backend server** running (default: http://localhost:8000)
3. **API key** for authentication (can be set during setup)

## Quick Start

1. **Run setup** (first time only):
   ```batch
   .\setup-cli.bat
   ```

2. **Use the CLI**:
   ```batch
   .\agis-cli.bat --help                    # Show all commands
   .\agis-cli.bat experiment list           # List experiments
   .\agis-cli.bat experiment create "test"  # Create experiment
   .\agis-cli.bat monitor dashboard         # Launch dashboard
   ```

## Common CLI Commands

### Experiment Management
```batch
agis-cli experiment create "healthcare_ai" --participants 5
agis-cli experiment list
agis-cli experiment status exp_123
agis-cli experiment delete exp_123
```

### Model Management
```batch
agis-cli model deploy mymodel.pt --experiment exp_123
agis-cli model list
```

### Monitoring
```batch
agis-cli monitor dashboard --experiment exp_123
agis-cli monitor dashboard --refresh 10
```

### Governance & Audit
```batch
agis-cli governance audit exp_123 --output report.json
```

### Attack Simulation (Red Team)
```batch
agis-cli simulation run --attack poisoning --num-adversaries 3
agis-cli simulation run --attack model-inversion
agis-cli simulation status
agis-cli simulation report --days 7 --format html
```

### Configuration
```batch
agis-cli config set api_key your_api_key_here
agis-cli config set server_url http://localhost:8000
agis-cli config list
```

## Configuration

The CLI stores configuration in `~/.agisfl/config.yaml`:

- `server_url`: AgisFL backend URL (default: http://localhost:8000)
- `api_key`: Authentication key (required for most operations)
- `output_format`: Output format (table/json)
- `default_timeout`: Request timeout in seconds

## Troubleshooting

### "Python not found" error
- Install Python 3.8+ from python.org
- Add Python to your system PATH
- Restart command prompt

### "No API key configured" error
- Run `.\setup-cli.bat` to configure
- Or manually set: `agis-cli config set api_key YOUR_KEY`

### Connection errors
- Ensure AgisFL backend is running on the configured URL
- Check firewall settings
- Verify server URL with: `agis-cli config get server_url`

### Permission errors
- Run command prompt as Administrator
- Check file permissions in the AgisFL directory

## Advanced Usage

### Real-time Monitoring
```batch
# Watch experiment status in real-time
agis-cli experiment status exp_123 --watch

# Monitor all experiments
agis-cli monitor dashboard
```

### Attack Simulation
```batch
# Run comprehensive security test
agis-cli simulation run --attack poisoning --intensity 2.0 --privacy-budget 0.5

# Generate security report
agis-cli simulation report --days 30 --format html --output security_report.html
```

### Batch Operations
```batch
# Create multiple experiments
for /l %%i in (1,1,5) do agis-cli experiment create "batch_exp_%%i" --participants 10
```

## Support

For issues with the CLI scripts:
1. Check the troubleshooting section above
2. Verify your AgisFL backend is running
3. Ensure all prerequisites are met
4. Check the main AgisFL documentation

For CLI command help:
```batch
agis-cli --help
agis-cli [command] --help
```
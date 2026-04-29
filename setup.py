"""
AI-Based Multi-Agent Framework for Legal Document Analysis
Quick Start Script

This script provides an easy way to run the entire application locally.
It handles:
1. Backend installation and startup
2. Frontend installation and startup
3. Database initialization
4. Configuration setup
"""

import os
import sys
import subprocess
import time
import platform
from pathlib import Path

def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 50)
    print(f"  {text}")
    print("=" * 50 + "\n")

def print_success(text):
    """Print success message"""
    print(f"✓ {text}")

def print_error(text):
    """Print error message"""
    print(f"✗ {text}")

def print_info(text):
    """Print info message"""
    print(f"ℹ {text}")

def check_python():
    """Check if Python 3.9+ is installed"""
    print_header("Checking Python Installation")
    
    if sys.version_info >= (3, 9):
        print_success(f"Python {sys.version_info.major}.{sys.version_info.minor} detected")
        return True
    else:
        print_error(f"Python 3.9+ required. Found: {sys.version_info.major}.{sys.version_info.minor}")
        return False

def check_nodejs():
    """Check if Node.js is installed"""
    print_header("Checking Node.js Installation")
    
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        version = result.stdout.strip()
        print_success(f"Node.js {version} detected")
        return True
    except FileNotFoundError:
        print_error("Node.js is not installed or not in PATH")
        return False

def setup_backend():
    """Setup and start backend server"""
    print_header("Backend Setup")
    
    backend_path = Path(__file__).parent / "backend"
    os.chdir(backend_path)
    
    # Check .env file
    env_file = backend_path / ".env"
    if not env_file.exists():
        print_info("Creating .env file from .env.example...")
        env_example = backend_path / ".env.example"
        if env_example.exists():
            with open(env_example, 'r') as f:
                content = f.read()
            with open(env_file, 'w') as f:
                f.write(content)
            print_success(".env file created")
        else:
            print_error("No .env.example found")
            return False
    
    # Create virtual environment
    venv_path = backend_path / "venv"
    if not venv_path.exists():
        print_info("Creating Python virtual environment...")
        subprocess.run([sys.executable, '-m', 'venv', 'venv'], check=True)
        print_success("Virtual environment created")
    
    # Install dependencies
    print_info("Installing Python dependencies...")
    if platform.system() == "Windows":
        pip_cmd = str(venv_path / "Scripts" / "pip")
    else:
        pip_cmd = str(venv_path / "bin" / "pip")
    
    subprocess.run([pip_cmd, 'install', '-q', '-r', 'requirements.txt'], check=True)
    print_success("Dependencies installed")
    
    return True

def setup_frontend():
    """Setup frontend"""
    print_header("Frontend Setup")
    
    frontend_path = Path(__file__).parent / "frontend"
    os.chdir(frontend_path)
    
    # Check if node_modules exists
    node_modules = frontend_path / "node_modules"
    if not node_modules.exists():
        print_info("Installing Node.js dependencies...")
        subprocess.run(['npm', 'install', '-q'], check=True)
        print_success("Dependencies installed")
    else:
        print_success("Node modules already installed")
    
    return True

def print_usage():
    """Print usage instructions"""
    print_header("Setup Complete!")
    
    print("To start the application, run:\n")
    
    if platform.system() == "Windows":
        print("  Backend (in one terminal):")
        print("    cd backend")
        print("    venv\\Scripts\\activate")
        print("    python main.py\n")
    else:
        print("  Backend (in one terminal):")
        print("    cd backend")
        print("    source venv/bin/activate")
        print("    python main.py\n")
    
    print("  Frontend (in another terminal):")
    print("    cd frontend")
    print("    npm run dev\n")
    
    print("Then open your browser to: http://localhost:5173\n")
    print("Backend API: http://localhost:8000")
    print("API Docs: http://localhost:8000/docs\n")

def main():
    """Main setup function"""
    print_header("Legal Document Analysis Platform - Setup")
    
    # Check requirements
    if not check_python():
        print_error("Setup failed: Python 3.9+ is required")
        sys.exit(1)
    
    if not check_nodejs():
        print_error("Setup failed: Node.js is required")
        sys.exit(1)
    
    # Setup backend and frontend
    try:
        if not setup_backend():
            print_error("Backend setup failed")
            sys.exit(1)
        
        if not setup_frontend():
            print_error("Frontend setup failed")
            sys.exit(1)
        
        print_usage()
        
    except Exception as e:
        print_error(f"Setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

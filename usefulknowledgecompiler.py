#!/usr/bin/env python3
"""
Script to compile all TypeScript, React, and CSS files from @oskit and src folders
into a single "Complete Frontend Knowledge" text file.
"""

import os
import sys
from pathlib import Path

# Global variable to store project root
PROJECT_ROOT = None

# Define all file extensions to search for
FILE_EXTENSIONS = [
    # TypeScript files
    "*.ts", "*.tsx",
    # JavaScript/React files
    "*.js", "*.jsx",
    # CSS files
    "*.css", "*.scss", "*.sass", "*.less",
    # Style modules
    "*.module.css", "*.module.scss", "*.module.sass",
    # Additional frontend files
    "*.vue", "*.svelte"
]

def find_project_directory():
    """
    Find the directory containing @oskit and src folders.
    Searches current directory and all subdirectories.
    
    Returns:
        Path or None: Path to the project directory, or None if not found
    """
    current_dir = Path.cwd()
    
    # First check current directory
    if (current_dir / "@oskit").exists() or (current_dir / "src").exists():
        return current_dir
    
    # Search all subdirectories
    for item in current_dir.rglob("*"):
        if item.is_dir():
            oskit_path = item / "@oskit"
            src_path = item / "src"
            if oskit_path.exists() or src_path.exists():
                return item
    
    return None

def find_frontend_files(folder_path):
    """
    Recursively find all frontend files in the given folder.
    
    Args:
        folder_path (str): Path to the folder to search
        
    Returns:
        dict: Dictionary with extension as key and list of Path objects as values
    """
    folder = Path(folder_path).resolve()
    if not folder.exists():
        print(f"Warning: Folder '{folder_path}' does not exist, skipping...")
        return {}
    
    files_by_type = {}
    
    # Search for each file extension
    for extension in FILE_EXTENSIONS:
        files = list(folder.rglob(extension))
        if files:
            # Group by actual extension (since some patterns like *.module.css are more specific)
            for file in files:
                actual_ext = ''.join(file.suffixes)  # Gets all suffixes like .module.css
                if actual_ext not in files_by_type:
                    files_by_type[actual_ext] = []
                files_by_type[actual_ext].append(file)
    
    # Sort files within each type
    for ext in files_by_type:
        files_by_type[ext] = sorted(files_by_type[ext])
    
    return files_by_type

def get_file_category(file_path):
    """
    Categorize file based on its extension.
    
    Args:
        file_path (Path): Path to the file
        
    Returns:
        str: Category name
    """
    suffixes = ''.join(file_path.suffixes).lower()
    
    if suffixes in ['.ts', '.tsx']:
        return 'TypeScript'
    elif suffixes in ['.js', '.jsx']:
        return 'JavaScript/React'
    elif suffixes in ['.css', '.module.css']:
        return 'CSS'
    elif suffixes in ['.scss', '.sass', '.module.scss', '.module.sass']:
        return 'SCSS/Sass'
    elif suffixes in ['.less']:
        return 'LESS'
    elif suffixes in ['.vue']:
        return 'Vue'
    elif suffixes in ['.svelte']:
        return 'Svelte'
    else:
        return 'Other'

def create_file_tree(all_files_dict):
    """
    Create a visual file structure tree from the dictionary of files.
    
    Args:
        all_files_dict (dict): Dictionary with extensions as keys and file lists as values
        
    Returns:
        str: String representation of the file tree
    """
    # Flatten all files for tree creation
    all_files = []
    for file_list in all_files_dict.values():
        all_files.extend(file_list)
    
    if not all_files:
        return "No files found.\n"
    
    # Group files by their directory structure
    tree_dict = {}
    
    for file_path in all_files:
        try:
            # Get relative path from project root
            try:
                relative_path = file_path.relative_to(PROJECT_ROOT)
            except (ValueError, TypeError):
                relative_path = str(file_path).replace(str(PROJECT_ROOT), "").lstrip(os.sep)
                relative_path = Path(relative_path)
            
            # Split the path into parts
            parts = relative_path.parts
            
            # Build nested dictionary structure
            current_dict = tree_dict
            for part in parts[:-1]:  # All parts except the filename
                if part not in current_dict:
                    current_dict[part] = {}
                current_dict = current_dict[part]
            
            # Add the filename
            filename = parts[-1]
            current_dict[filename] = None  # None indicates it's a file, not a directory
            
        except Exception as e:
            print(f"Warning: Could not process path {file_path}: {e}")
    
    # Convert dictionary to tree string
    def dict_to_tree(d, prefix="", is_last=True):
        items = list(d.items())
        tree_str = ""
        
        for i, (name, value) in enumerate(items):
            is_last_item = (i == len(items) - 1)
            
            # Choose the appropriate tree characters
            if prefix == "":
                current_prefix = ""
                connector = ""
            else:
                connector = "└── " if is_last_item else "├── "
                current_prefix = prefix
            
            tree_str += f"{current_prefix}{connector}{name}\n"
            
            # If it's a directory (value is not None), recurse
            if value is not None:
                extension = "    " if is_last_item else "│   "
                new_prefix = prefix + extension
                tree_str += dict_to_tree(value, new_prefix, is_last_item)
        
        return tree_str
    
    return dict_to_tree(tree_dict)

def read_file_content(file_path):
    """
    Read the content of a file with error handling.
    
    Args:
        file_path (Path): Path to the file to read
        
    Returns:
        str: File content or error message
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        try:
            # Try with different encoding if UTF-8 fails
            with open(file_path, 'r', encoding='latin-1') as f:
                return f.read()
        except Exception as e:
            return f"Error reading file: {str(e)}"
    except Exception as e:
        return f"Error reading file: {str(e)}"

def compile_frontend_knowledge():
    """
    Main function to compile all frontend files into a single knowledge file.
    """
    print("Starting compilation of all frontend files...")
    
    # Find the project directory
    project_dir = find_project_directory()
    if not project_dir:
        print("Could not find a directory containing '@oskit' or 'src' folders.")
        print("Please make sure the target project is accessible from the current location.")
        return
    
    print(f"Found project directory: {project_dir}")
    
    # Define the folders to search (relative to project directory)
    target_folders = [project_dir / "@oskit", project_dir / "src"]
    output_file = "Complete Frontend Knowledge.txt"
    
    all_files_dict = {}
    total_files = 0
    
    # Find all frontend files in target folders
    for folder_path in target_folders:
        folder_name = folder_path.name
        if folder_path.exists():
            print(f"Searching in folder: {folder_path}")
            files_dict = find_frontend_files(str(folder_path))
            
            # Merge dictionaries
            for ext, files in files_dict.items():
                if ext not in all_files_dict:
                    all_files_dict[ext] = []
                all_files_dict[ext].extend(files)
                total_files += len(files)
            
            folder_total = sum(len(files) for files in files_dict.values())
            print(f"Found {folder_total} frontend files in {folder_name}")
        else:
            print(f"Folder '{folder_name}' not found in project directory, skipping...")
    
    if not all_files_dict:
        print("No frontend files found in the specified folders.")
        return
    
    # Sort files within each extension group
    for ext in all_files_dict:
        all_files_dict[ext] = sorted(all_files_dict[ext])
    
    print(f"Total files found: {total_files}")
    print("File breakdown:")
    for ext, files in sorted(all_files_dict.items()):
        print(f"  {ext}: {len(files)} files")
    
    print(f"Compiling to: {output_file}")
    
    # Store project directory for relative path calculations
    global PROJECT_ROOT
    PROJECT_ROOT = project_dir
    
    # Write all files to the output file
    try:
        with open(output_file, 'w', encoding='utf-8') as output:
            # Write the file structure diagram first
            output.write("Complete Frontend File Structure Diagram\n")
            output.write("=" * 60 + "\n\n")
            
            tree_structure = create_file_tree(all_files_dict)
            output.write(tree_structure)
            output.write("\n" + "=" * 80 + "\n\n")
            
            # Write file summary by type
            output.write("File Summary by Type\n")
            output.write("=" * 30 + "\n\n")
            for ext, files in sorted(all_files_dict.items()):
                category = get_file_category(files[0]) if files else "Unknown"
                output.write(f"{category} ({ext}): {len(files)} files\n")
            output.write(f"\nTotal: {total_files} files\n")
            output.write("\n" + "=" * 80 + "\n\n")
            
            # Write all the file contents, grouped by type
            file_count = 0
            for ext, files in sorted(all_files_dict.items()):
                if files:
                    category = get_file_category(files[0])
                    output.write(f"=== {category} Files ({ext}) ===\n")
                    output.write("=" * 50 + "\n\n")
                    
                    for file_path in files:
                        file_count += 1
                        print(f"Processing file {file_count}/{total_files}: {file_path}")
                        
                        # Write the header with file name
                        try:
                            relative_path = file_path.relative_to(PROJECT_ROOT)
                        except (ValueError, TypeError):
                            relative_path = str(file_path).replace(str(PROJECT_ROOT), "").lstrip(os.sep)
                        
                        # Normalize path separators for consistent output
                        relative_path_str = str(relative_path).replace(os.sep, '/')
                        output.write(f"*> [{relative_path_str}]\n")
                        output.write("*" * 20 + "\n\n")
                        
                        # Read and write file content
                        content = read_file_content(file_path)
                        output.write(content)
                        
                        # Add spacing between files
                        output.write("\n\n" + "-" * 50 + "\n\n")
                    
                    # Add spacing between file types
                    output.write("\n" + "=" * 80 + "\n\n")
        
        print(f"Successfully compiled {total_files} files to '{output_file}'")
        
    except Exception as e:
        print(f"Error writing to output file: {str(e)}")
        sys.exit(1)

def main():
    """
    Entry point of the script.
    """
    print("Complete Frontend Knowledge Compiler")
    print("=" * 50)
    print("Searching for: TypeScript, JavaScript, React, CSS, SCSS, Sass, LESS, Vue, Svelte files")
    print("=" * 50)
    
    # Check current directory
    current_dir = Path.cwd()
    print(f"Running from: {current_dir}")
    
    compile_frontend_knowledge()

if __name__ == "__main__":
    main()
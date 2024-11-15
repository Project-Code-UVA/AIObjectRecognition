import os
import sys

# Add the project's source code directory to the system path
sys.path.insert(0, os.path.abspath('../src'))

# Project information
project = 'AI Object Recognition'
author = 'Your Name or Team'
release = '1.0.0'

# Sphinx extensions
extensions = [
    'sphinx.ext.autodoc',      # Automatically generate documentation from docstrings
    'sphinx.ext.napoleon',     # Support for NumPy and Google style docstrings
    'sphinx.ext.viewcode',     # Add links to source code
]

# Templates and static files
templates_path = ['_templates']
html_static_path = ['_static']

# Files and patterns to exclude from the build
exclude_patterns = []

# HTML theme
html_theme = 'alabaster'  # Replace with 'sphinx_rtd_theme' if you prefer ReadTheDocs style

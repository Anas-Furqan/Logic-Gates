import React from 'react';
import { Divider, Link } from '@heroui/react';
import { Heart, Github, Coffee } from 'lucide-react';

/**
 * Footer Component
 */
export default function Footer() {
  return (
    <footer className="mt-auto py-6 px-4 border-t border-default-200 bg-content1/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-default-500">
            <span>Built with</span>
            <Heart className="w-4 h-4 text-danger fill-danger" />
            <span>for digital logic education</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="https://github.com"
              target="_blank"
              className="flex items-center gap-1 text-default-500 hover:text-primary"
            >
              <Github className="w-4 h-4" />
              <span>Source Code</span>
            </Link>
            <Divider orientation="vertical" className="h-4" />
            <span className="text-default-400">
              © {new Date().getFullYear()} LogicLab
            </span>
          </div>
        </div>
        
        <div className="mt-4 text-center text-xs text-default-400">
          <p>
            Supports: AND, OR, NOT, XOR, NAND, NOR, XNOR gates • 
            Truth tables • K-Maps • Quine-McCluskey simplification
          </p>
        </div>
      </div>
    </footer>
  );
}

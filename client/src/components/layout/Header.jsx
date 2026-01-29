import React from 'react';
import { 
  Navbar, 
  NavbarBrand, 
  NavbarContent, 
  NavbarItem,
  Button,
  Link,
  Chip,
} from '@heroui/react';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Github, 
  Sun, 
  Moon,
  Zap
} from 'lucide-react';

/**
 * Header Component
 * Main navigation header for LogicLab
 */
export default function Header({ darkMode, setDarkMode }) {
  return (
    <Navbar
      maxWidth="full"
      className="bg-content1/50 backdrop-blur-md border-b border-default-200"
    >
      <NavbarBrand>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success-500"
            />
          </div>
          <div>
            <p className="font-bold text-xl tracking-tight">
              Logic<span className="text-primary">Lab</span>
            </p>
            <p className="text-xs text-default-400">
              Digital Logic Simulator
            </p>
          </div>
        </motion.div>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <Chip
            startContent={<Zap className="w-3 h-3" />}
            variant="flat"
            color="warning"
            size="sm"
          >
            Interactive
          </Chip>
        </NavbarItem>
        <NavbarItem>
          <Chip
            variant="flat"
            color="success"
            size="sm"
          >
            Real-time Simulation
          </Chip>
        </NavbarItem>
        <NavbarItem>
          <Chip
            variant="flat"
            color="primary"
            size="sm"
          >
            Educational
          </Chip>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Button
            isIconOnly
            variant="light"
            aria-label="Toggle dark mode"
            onClick={() => setDarkMode?.(!darkMode)}
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
        </NavbarItem>
        <NavbarItem>
          <Button
            as={Link}
            href="https://github.com"
            target="_blank"
            isIconOnly
            variant="light"
            aria-label="GitHub"
          >
            <Github className="w-5 h-5" />
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}

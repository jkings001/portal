import { motion, AnimatePresence, Variants } from "framer-motion";
import { useLocation } from "wouter";
import { ReactNode } from "react";

// Variantes de animação para entrada e saída de páginas
// Sem blur/scale para máxima performance de GPU
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: {
      duration: 0.12,
      ease: "easeIn",
    },
  },
};

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Componente que envolve o conteúdo de uma página e aplica
 * animações de entrada/saída usando Framer Motion.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ width: "100%", minHeight: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Variantes para componentes internos (cards, listas, etc.) ───────────────

/** Animação de entrada em cascata para listas de itens */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

/** Animação de cada item em uma lista com stagger */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

/** Animação de fade simples para elementos que aparecem */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

/** Animação de slide vindo da esquerda */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

/** Animação de slide vindo da direita */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

/** Animação de slide vindo de baixo */
export const slideInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

/** Componente de seção animada com fade + slide up */
export function AnimatedSection({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Componente de card animado com hover interativo */
export function AnimatedCard({
  children,
  delay = 0,
  className = "",
  onClick,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay,
        ease: "easeOut",
      }}
      whileHover={{
        y: -2,
        transition: { duration: 0.12, ease: "easeOut" },
      }}
      whileTap={{ scale: 0.98 }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

/** Barra de progresso de navegação no topo da página */
export function NavigationProgress() {
  const [location] = useLocation();

  return (
    <AnimatePresence>
      <motion.div
        key={`progress-${location}`}
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "linear-gradient(90deg, #00d4ff, #0099cc, #00d4ff)",
          transformOrigin: "left center",
          zIndex: 9999,
          boxShadow: "0 0 6px rgba(0, 212, 255, 0.7)",
          pointerEvents: "none",
        }}
      />
    </AnimatePresence>
  );
}

export default PageTransition;

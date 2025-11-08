import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";

export const SplineBackground = ({ className, children }) => {
  return (
    <div className={cn("relative min-h-screen overflow-hidden", className)}>
      {/* Animated 3D Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950">
        
        {/* Floating hexagons - responsive sizes */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`hex-${i}`}
              className="absolute"
              style={{
                left: `${15 + (i % 3) * 30}%`,
                top: `${10 + Math.floor(i / 3) * 40}%`,
              }}
              animate={{
                y: [0, -40, 0],
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 15 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            >
              <div 
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-36 lg:h-36"
                style={{
                  background: `linear-gradient(135deg, rgba(13, 148, 136, ${0.1 + i * 0.05}), rgba(6, 182, 212, ${0.1 + i * 0.05}))`,
                  clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                  filter: 'blur(1px)',
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Rotating rings - responsive */}
        <motion.div
          className="absolute top-1/4 right-1/6 md:right-1/4 w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80"
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-teal-500/20" />
          <div className="absolute inset-2 sm:inset-4 rounded-full border-2 border-cyan-500/15" />
          <div className="absolute inset-4 sm:inset-8 rounded-full border-2 border-teal-400/10" />
        </motion.div>

        <motion.div
          className="absolute bottom-1/4 left-1/6 md:left-1/4 w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-72 lg:h-72"
          animate={{
            rotate: -360,
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
          <div className="absolute inset-2 sm:inset-4 rounded-full border-2 border-teal-500/15" />
        </motion.div>

        {/* Glowing orbs - responsive positioning */}
        <motion.div
          className="absolute top-1/3 left-1/5 w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 bg-gradient-to-br from-teal-500/30 to-cyan-500/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 60, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="absolute bottom-1/3 right-1/5 w-28 h-28 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-72 lg:h-72 bg-gradient-to-br from-cyan-500/25 to-teal-500/25 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.4, 1],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Animated cubes - responsive */}
        <div className="absolute inset-0">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`cube-${i}`}
              className="absolute hidden sm:block"
              style={{
                left: `${20 + i * 25}%`,
                top: `${30 + (i % 2) * 30}%`,
              }}
              animate={{
                rotateX: [0, 360],
                rotateY: [0, 360],
                y: [0, -30, 0],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.8,
              }}
            >
              <div 
                className="w-10 h-10 md:w-16 md:h-16 lg:w-20 lg:h-20"
                style={{
                  background: `linear-gradient(135deg, rgba(13, 148, 136, 0.15), rgba(6, 182, 212, 0.15))`,
                  border: '1px solid rgba(13, 148, 136, 0.3)',
                  transform: 'rotateX(45deg) rotateY(45deg)',
                  transformStyle: 'preserve-3d',
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Particle system - responsive count */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-teal-400/40 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 50 - 25, 0],
                opacity: [0.1, 0.6, 0.1],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 4 + Math.random() * 6,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Dynamic grid with perspective - responsive */}
        <div className="absolute inset-0 opacity-10">
          <motion.div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(13, 148, 136, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(13, 148, 136, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
              transform: 'perspective(800px) rotateX(60deg) scale(2)',
              transformOrigin: 'center center',
            }}
            animate={{
              backgroundPosition: ['0px 0px', '40px 40px'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        {/* Radial gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-slate-950/50" />
        
        {/* Additional gradient for mobile optimization */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-slate-950/30" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

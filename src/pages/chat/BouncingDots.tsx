import { motion } from 'framer-motion';

const BouncingDots = () => {
  return (
    <div className="flex space-x-1">
      <motion.div
        className="w-2 h-2 bg-muted-foreground rounded-full"
        animate={{
          y: [-4, 0, -4],
          transition: {
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      />
      <motion.div
        className="w-2 h-2 bg-muted-foreground rounded-full"
        animate={{
          y: [-4, 0, -4],
          transition: {
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.1
          }
        }}
      />
      <motion.div
        className="w-2 h-2 bg-muted-foreground rounded-full"
        animate={{
          y: [-4, 0, -4],
          transition: {
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2
          }
        }}
      />
    </div>
  );
};

export default BouncingDots; 
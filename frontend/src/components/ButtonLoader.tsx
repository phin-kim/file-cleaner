import { motion } from 'framer-motion';

interface ButtonLoaderProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
}

export default function ButtonLoader({
    size = 'md',
    color = '#fff',
}: ButtonLoaderProps) {
    const sizeMap = {
        sm: { dot: 4, container: 12 },
        md: { dot: 5, container: 16 },
        lg: { dot: 6, container: 20 },
    };

    const { dot, container } = sizeMap[size];

    return (
        <motion.div
            className="flex items-center justify-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {[0, 1, 2].map((index) => (
                <motion.div
                    key={index}
                    className="rounded-full"
                    style={{
                        width: dot,
                        height: dot,
                        backgroundColor: color,
                    }}
                    animate={{
                        y: [-container, 0, -container],
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: index * 0.1,
                    }}
                />
            ))}
        </motion.div>
    );
}

import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import {
    FileText,
    ImageIcon,
    Code,
    HardDrive,
    Zap,
    type LucideIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { useGeneralStore } from '../Store/generalStore';
// A bit deeper, more professional contrast
/*const COLORS = [
    '#D946EF', // Deep Fuchsia (instead of soft Pink)
    '#4F46E5', // Indigo 600 (stronger than 400)
    '#0D9488', // Teal 600 (richer than 400)
    '#D97706', // Amber 600 (golden-deep instead of bright yellow)
];*/
const COLORS = ['#F0ABFC', '#818CF8', '#2DD4BF', '#FBBF24'];
type FileCategory = 'Pictures' | 'Documents' | 'Code' | 'Others';
const ICON_MAP: Record<FileCategory, LucideIcon> = {
    Pictures: ImageIcon,
    Documents: FileText,
    Code: Code,
    Others: HardDrive,
};

export default function BreakdownPie({}) {
    const cleaningStats = useGeneralStore((state) => state.cleaningStats);

    const FILE_TYPE_DATA = useMemo(() => {
        if (!cleaningStats?.breakdown) return [];
        return Object.entries(cleaningStats.breakdown).map(([key, data]) => ({
            name: key,
            value: data.count,
            size: data.sizeByBytes,
            icon: ICON_MAP[key as keyof typeof ICON_MAP] || HardDrive,
        }));
    }, [cleaningStats]);
    if (FILE_TYPE_DATA.length === 0) {
        return <div>Loading chart ...</div>;
    }

    // Optional: Calculate total for percentage display
    const totalFiles = FILE_TYPE_DATA.reduce(
        (acc, curr) => acc + curr.value,
        0
    );

    return (
        <>
            <div className="mb-12 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <h3 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white">
                    <Zap className="h-6 w-6 text-fuchsia-400" />
                    File Type Breakdown
                </h3>
                <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                    <div className="h-64">
                        <PieChart
                            style={{
                                width: '100%',
                                maxWidth: '300px',
                                maxHeight: '40vh',
                                aspectRatio: 1,
                            }}
                            responsive
                        >
                            <Pie
                                data={FILE_TYPE_DATA}
                                innerRadius="80%"
                                outerRadius="100%"
                                // Corner radius is the rounded edge of each pie slice
                                cornerRadius="50%"
                                fill="#8884d8"
                                // padding angle is the gap between each pie slice
                                paddingAngle={5}
                                isAnimationActive={true}
                                dataKey="value"
                            >
                                {FILE_TYPE_DATA.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e1b4b',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#fff',
                                }}
                                itemStyle={{ color: '#fff' }}
                            />
                        </PieChart>
                    </div>
                    <div className="space-y-3">
                        {FILE_TYPE_DATA.map((item, index) => {
                            const IconComponent = item.icon;
                            const percentage =
                                totalFiles > 0
                                    ? ((item.value / totalFiles) * 100).toFixed(
                                          1
                                      )
                                    : 0;

                            return (
                                <div
                                    key={item.name}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-3 w-3 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    COLORS[
                                                        index % COLORS.length
                                                    ],
                                            }}
                                        />
                                        <div
                                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"
                                            style={{
                                                color: COLORS[
                                                    index % COLORS.length
                                                ],
                                            }}
                                        >
                                            <IconComponent className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm text-purple-200/80">
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold text-white">
                                        {percentage}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

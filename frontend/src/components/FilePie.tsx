import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts';
import useCleaner from '../hooks/useCleaner';
import {
    FileText,
    ImageIcon,
    Code,
    HardDrive,
    Zap,
    type LucideIcon,
} from 'lucide-react';
const COLORS = ['#F0ABFC', '#818CF8', '#2DD4BF', '#FBBF24'];
type FileCategory = 'Pictures' | 'Documents' | 'Code' | 'Others';
const ICON_MAP: Record<FileCategory, LucideIcon> = {
    Pictures: ImageIcon,
    Documents: FileText,
    Code: Code,
    Others: HardDrive,
};
export default function BreakdownPie() {
    const { cleaningStats } = useCleaner();
    const breakdown = cleaningStats?.breakdown;
    const FILE_TYPE_DATA = breakdown
        ? Object.entries(breakdown).map(([key, data]) => {
              // 3. Cast the key so TS knows it's one of our categories
              const category = key as FileCategory;

              return {
                  name: category,
                  value: data.count,
                  size: data.sizeByBytes,
                  icon: ICON_MAP[category] || HardDrive,
              };
          })
        : [];

    // Optional: Calculate total for percentage display
    const totalFiles = FILE_TYPE_DATA.reduce(
        (acc, curr) => acc + curr.value,
        0
    );

    return (
        <>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <h3 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white">
                    <Zap className="h-6 w-6 text-fuchsia-400" />
                    File Type Breakdown
                </h3>
                <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={FILE_TYPE_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {FILE_TYPE_DATA.map((entry, index) => (
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
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                        {FILE_TYPE_DATA.map((item, index) => (
                            <div
                                key={item.name}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-3 w-3 rounded-full"
                                        style={{
                                            backgroundColor:
                                                COLORS[index % COLORS.length],
                                        }}
                                    />
                                    <span className="text-sm text-purple-200/80">
                                        {item.name}
                                    </span>
                                </div>
                                <span className="text-sm font-bold text-white">
                                    {item.value}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

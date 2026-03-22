import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { PiBroomBold } from 'react-icons/pi';
import { useEffect, useState } from 'react';
/**
 * Breadcrumb component styled like MongoDB Atlas.
 * Automatically generates breadcrumbs based on the current URL path.
 */
export default function Breadcrumb() {
    const [isScrolled, setIsScrolled] = useState(false);
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    /**
     * Formats a path segment: capitalizes first letter and replaces hyphens with spaces.
     */
    const formatSegment = (segment: string) => {
        return segment
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    return (
        <div className="relative">
            <nav
                aria-label="Breadcrumb"
                className={`fixed top-0 right-0 left-0 z-50 flex w-full items-center gap-4 border-b-2 px-4 py-2 font-sans text-sm transition-all duration-300 ${
                    isScrolled
                        ? 'border-white/10 bg-white/10 py-2 backdrop-blur-md'
                        : 'border-transparent bg-transparent py-4'
                }`}
                id="breadcrumb-nav"
            >
                <div className="bg-gradient-purple-blue flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white">
                    <PiBroomBold className="text-2xl" />
                </div>
                <span className="text-xl font-bold text-slate-100">
                    Tidy up
                </span>
                <ol className="m-0 flex list-none items-center space-x-2 p-0">
                    {/* Home Link */}
                    <li className="flex items-center">
                        <Link
                            to="/"
                            className={`transition-color flex items-center rounded-2xl p-2 text-gray-200 duration-200 hover:bg-white/30 hover:backdrop-blur-md`}
                            id="breadcrumb-home"
                        >
                            <Home size={16} className="mr-1" />
                            <span>Home</span>
                        </Link>
                    </li>

                    {pathnames.map((value, index) => {
                        const last = index === pathnames.length - 1;
                        const to = `/${pathnames.slice(0, index + 1).join('/')}`;

                        return (
                            <li key={to} className="flex items-center">
                                <ChevronRight
                                    size={14}
                                    className="mx-2 shrink-0 text-gray-400"
                                    aria-hidden="true"
                                />
                                {last ? (
                                    <span
                                        className="font-semibold text-gray-200"
                                        id={`breadcrumb-current-${value}`}
                                    >
                                        {formatSegment(value)}
                                    </span>
                                ) : (
                                    <Link
                                        to={to}
                                        className="rounded-2xl p-2 text-gray-200 underline-offset-4 transition-colors duration-200 hover:bg-white/30 hover:backdrop-blur-md"
                                        id={`breadcrumb-link-${value}`}
                                    >
                                        {formatSegment(value)}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </div>
    );
}

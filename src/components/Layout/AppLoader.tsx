import LovedOneLogo from '../../assets/LovedOne_Logo_black.png';

interface AppLoaderProps {
  message?: string;
}

const AppLoader = ({ message = 'Loading…' }: AppLoaderProps) => (
  <div
    role="status"
    aria-live="polite"
    className="fixed inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900"
  >
    <img
      src={LovedOneLogo}
      alt="LovedOne"
      className="w-40 h-40 object-contain mb-6 animate-pulse dark:invert"
    />
    <div className="h-10 w-10 rounded-full border-4 border-slate-300 border-t-slate-700 animate-spin dark:border-slate-700 dark:border-t-slate-200" />
    <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{message}</p>
  </div>
);

export default AppLoader;

export default function Footer() {
  const year = new Date().getFullYear();
  const repo =
    "https://github.com/e00049/mywallettracker-azurenewrelic-project";

  return (
    <footer className="border-t bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-slate-500
                      flex flex-col sm:flex-row justify-between
                      items-center gap-2">
        <span>&copy; {year} MyWalletTracker</span>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">
            ReactJS &middot; Django &middot; Azure AKS
          </span>
          <span>
            Project code here &mdash;{" "}
            <a
              href={repo}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-900"
            >
              GitHub
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

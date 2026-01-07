import TransactionStatusChecker from './components/TransactionStatusChecker';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <TransactionStatusChecker />
    </div>
  );
}

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full ${
        isConnected ? "bg-green-600/80 text-white" : "bg-red-600/80 text-white"
      }`}
    >
      {isConnected ? "Connected" : "Disconnected"}
    </span>
  );
}

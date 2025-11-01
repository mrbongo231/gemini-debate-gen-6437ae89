export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12 animate-in fade-in">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
        <div 
          className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
        ></div>
      </div>
      <p className="text-sm text-muted-foreground font-medium">
        Generating debate cards...
      </p>
    </div>
  );
};

import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "NEWagro_v2";
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">NEWagro_v2</h1>
        <p className="text-xl text-muted-foreground">Projeto em branco.</p>
      </div>
    </div>
  );
};

export default Index;

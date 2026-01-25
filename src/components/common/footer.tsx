export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto flex h-14 items-center justify-center px-4 md:px-6">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} NIT Agartala CEWN. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

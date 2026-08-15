interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div
      className={`bg-white rounded-3xl p-6 shadow-card transition-shadow duration-200 border border-black/5 ${className}`}
    >
      {children}
    </div>
  );
};

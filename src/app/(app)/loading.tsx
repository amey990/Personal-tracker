export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: "50vh",
      }}
    >
      <div
        className="animate-spin"
        style={{
          width: 32,
          height: 32,
          border: "3px solid var(--border)",
          borderTopColor: "#a855f7",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}

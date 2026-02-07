import { useMemo } from "react";

export default function Table({ players = 4 }) {
  const seats = useMemo(() => {
    const radius = 180;
    const center = { x: 300, y: 250 };
    const angleStep = (2 * Math.PI) / players;

    return Array.from({ length: players }).map((_, i) => {
      const angle = i * angleStep;
      return {
        id: i + 1,
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
        avatar: `/avatars/player_${i + 1}.png`
      };
    });
  }, [players]);

  return (
    <div
      style={{
        position: "relative",
        width: 600,
        height: 500,
        background: "#0a3d2e",
        borderRadius: "50%",
        margin: "40px auto"
      }}
    >
      {seats.map(seat => (
        <img
          key={seat.id}
          src={seat.avatar}
          alt="avatar"
          style={{
            position: "absolute",
            left: seat.x,
            top: seat.y,
            width: 70,
            height: 70,
            borderRadius: "50%",
            border: "3px solid gold"
          }}
        />
      ))}
    </div>
  );
}

export default function SeatMap({
  seats,
  currentSeatId,
  onRequestSeat,
  requestingSeatId,
}) {
  const getSeatClass = (seat) => {
    if (seat._id === currentSeatId) {
      return "seat current";
    }

    switch (seat.status) {
      case "AVAILABLE":
        return "seat available";

      case "OCCUPIED":
        return "seat occupied";

      case "RESERVED":
        return "seat reserved";

      case "BLOCKED":
        return "seat blocked";

      default:
        return "seat";
    }
  };

  const getSeatTitle = (seat) => {
    if (seat._id === currentSeatId) {
      return "Your current seat";
    }

    if (seat.status === "AVAILABLE") {
      return "Available - Click to request";
    }

    if (seat.status === "OCCUPIED") {
      return seat.student ? `Occupied by ${seat.student.fullName}` : "Occupied";
    }

    if (seat.status === "RESERVED") {
      return "Reserved";
    }

    if (seat.status === "BLOCKED") {
      return seat.blockedReason ? `Blocked: ${seat.blockedReason}` : "Blocked";
    }

    return seat.status;
  };

  return (
    <div className="seat-map-wrapper">
      <div className="seat-legend">
        <div className="legend-item">
          <span className="legend-box available"></span>
          <span>Available</span>
        </div>

        <div className="legend-item">
          <span className="legend-box occupied"></span>
          <span>Occupied</span>
        </div>

        <div className="legend-item">
          <span className="legend-box reserved"></span>
          <span>Reserved</span>
        </div>

        <div className="legend-item">
          <span className="legend-box blocked"></span>
          <span>Blocked</span>
        </div>

        <div className="legend-item">
          <span className="legend-box current"></span>
          <span>My Seat</span>
        </div>
      </div>

      <div className="seat-map-section">
        <div className="seat-section-title">
          <div>
            <h4>Normal Seats</h4>
            <span>A001 - A208</span>
          </div>

          <span className="seat-count">
            {seats.filter((seat) => seat.seatType === "NORMAL").length} seats
          </span>
        </div>

        <div className="seat-grid">
          {seats
            .filter((seat) => seat.seatType === "NORMAL")
            .map((seat) => (
              <button
                key={seat._id}
                type="button"
                className={getSeatClass(seat)}
                title={getSeatTitle(seat)}
                disabled={
                  seat.status !== "AVAILABLE" ||
                  seat._id === currentSeatId ||
                  requestingSeatId === seat._id
                }
                onClick={() => onRequestSeat(seat)}
              >
                <span>{seat.seatNumber}</span>

                {seat._id === currentSeatId && <small>YOU</small>}

                {requestingSeatId === seat._id && <small>...</small>}
              </button>
            ))}
        </div>
      </div>

      <div className="seat-map-section special-section">
        <div className="seat-section-title">
          <div>
            <h4>Special Seats</h4>
            <span>S01 - S42</span>
          </div>

          <span className="seat-count">
            {seats.filter((seat) => seat.seatType === "SPECIAL").length} seats
          </span>
        </div>

        <div className="seat-grid special-grid">
          {seats
            .filter((seat) => seat.seatType === "SPECIAL")
            .map((seat) => (
              <button
                key={seat._id}
                type="button"
                className={getSeatClass(seat)}
                title={getSeatTitle(seat)}
                disabled={
                  seat.status !== "AVAILABLE" ||
                  seat._id === currentSeatId ||
                  requestingSeatId === seat._id
                }
                onClick={() => onRequestSeat(seat)}
              >
                <span>{seat.seatNumber}</span>

                {seat._id === currentSeatId && <small>YOU</small>}

                {requestingSeatId === seat._id && <small>...</small>}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

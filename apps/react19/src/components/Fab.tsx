import { useRef } from "react";

import { composeRef } from "../lib/composeRef";
import { config } from "../lib/config";
import { createDraggableController } from "../lib/draggableController";

const controller = createDraggableController({ coalesce: config.fix });

/**
 * A small floating widget — in the real app, a draggable support button that is
 * mounted on every page. It is not related to the feature that stalls; it just
 * happens to emit a Default-priority update every animation frame, forever.
 */
const Fab: React.FC = () => {
  const { targetRef, width } = controller.useController();
  const localRef = useRef<HTMLDivElement | null>(null);
  // A new composed callback on every render, exactly like a component library
  // merging refs. React therefore re-attaches on every commit.
  const ref = composeRef<HTMLDivElement>(localRef, targetRef);
  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        padding: "12px 16px",
        borderRadius: 999,
        background: "#1677ff",
        color: "#fff",
        font: "600 13px/1 system-ui, sans-serif",
        boxShadow: "0 4px 16px rgba(0,0,0,.24)",
      }}
    >
      widget ({width}px)
    </div>
  );
};

export { Fab };

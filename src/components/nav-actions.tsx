"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { SubmitTasksModal } from "./submit-tasks-modal";

export function NavActions() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setModalOpen(true)}>
        + Add Tasks
      </Button>

      {modalOpen && (
        <SubmitTasksModal onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

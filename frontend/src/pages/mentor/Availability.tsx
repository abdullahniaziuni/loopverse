import React, { useState } from "react";
import { Calendar, Clock, Plus, Trash2, Edit } from "lucide-react";
import { Layout } from "../../components/layout";
import { Button, Input, Modal } from "../../components/ui";
import { useToast } from "../../hooks/useToast";
import { formatDate, formatTime } from "../../utils";

interface AvailabilitySlotLocal {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export const Availability: React.FC = () => {
  const [slots, setSlots] = useState<AvailabilitySlotLocal[]>([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlotLocal | null>(
    null
  );
  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success: showSuccess, error: showError } = useToast();

  const handleAddSlot = () => {
    setFormData({ date: "", startTime: "", endTime: "" });
    setEditingSlot(null);
    setIsAddModalOpen(true);
  };

  const handleEditSlot = (slot: AvailabilitySlot) => {
    setFormData({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
    setEditingSlot(slot);
    setIsAddModalOpen(true);
  };

  const handleDeleteSlot = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId);
    if (slot?.isBooked) {
      showError(
        "Cannot delete a booked slot. Please contact the learner to reschedule."
      );
      return;
    }

    setSlots((prev) => prev.filter((s) => s.id !== slotId));
    showSuccess("Availability slot deleted successfully.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.startTime || !formData.endTime) {
      showError("Please fill in all fields.");
      return;
    }

    if (formData.startTime >= formData.endTime) {
      showError("End time must be after start time.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Push availability to backend in mentor weekly format
      const payload = slots
        .filter((s) => !s.isBooked)
        .map((s) => ({
          dayOfWeek: new Date(s.date).getDay(),
          startTime: s.startTime,
          endTime: s.endTime,
        }));

      // Optimistically update local state
      let newSlots = slots;
      if (editingSlot) {
        newSlots = slots.map((slot) =>
          slot.id === editingSlot.id ? { ...slot, ...formData } : slot
        );
      } else {
        const newSlot: AvailabilitySlotLocal = {
          id: Date.now().toString(),
          ...formData,
          isBooked: false,
        };
        newSlots = [...slots, newSlot];
      }
      setSlots(newSlots);

      const res = await apiService.updateMentorAvailability(payload);
      if (res.success) {
        showSuccess("Availability saved successfully.");
      } else {
        showError(res.error || "Failed to save availability");
        // Revert optimistic update
        setSlots(slots);
      }

      setIsAddModalOpen(false);
      setFormData({ date: "", startTime: "", endTime: "" });
      setEditingSlot(null);
    } catch (error) {
      showError("Failed to save availability slot. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Group slots by date
  const groupedSlots = slots.reduce((acc, slot) => {
    const date = slot.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

  // Sort dates
  const sortedDates = Object.keys(groupedSlots).sort();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Availability
            </h1>
            <p className="text-gray-600 mt-2">
              Set your available time slots for mentoring sessions.
            </p>
          </div>
          <Button onClick={handleAddSlot} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Slot
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {slots.length}
            </div>
            <div className="text-sm text-gray-600">Total Slots</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {slots.filter((s) => !s.isBooked).length}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {slots.filter((s) => s.isBooked).length}
            </div>
            <div className="text-sm text-gray-600">Booked</div>
          </div>
        </div>

        {/* Availability Slots */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {sortedDates.length > 0 ? (
              <div className="space-y-8">
                {sortedDates.map((date) => (
                  <div key={date}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      {formatDate(date)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedSlots[date]
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((slot) => (
                          <SlotCard
                            key={slot.id}
                            slot={slot}
                            onEdit={handleEditSlot}
                            onDelete={handleDeleteSlot}
                          />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No availability slots set
                </h3>
                <p className="text-gray-600 mb-4">
                  Add your first availability slot to start receiving booking
                  requests.
                </p>
                <Button onClick={handleAddSlot}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Slot
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingSlot ? "Edit Availability Slot" : "Add Availability Slot"}
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <Input
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
              min={new Date().toISOString().split("T")[0]}
            />

            <Input
              label="Start Time"
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleChange}
              required
            />

            <Input
              label="End Time"
              name="endTime"
              type="time"
              value={formData.endTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              {editingSlot ? "Update Slot" : "Add Slot"}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

interface SlotCardProps {
  slot: AvailabilitySlot;
  onEdit: (slot: AvailabilitySlot) => void;
  onDelete: (slotId: string) => void;
}

const SlotCard: React.FC<SlotCardProps> = ({ slot, onEdit, onDelete }) => {
  return (
    <div
      className={`border rounded-lg p-4 ${
        slot.isBooked
          ? "border-green-200 bg-green-50"
          : "border-gray-200 bg-white hover:shadow-md transition-shadow"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">
            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
          </span>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            slot.isBooked
              ? "bg-green-100 text-green-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {slot.isBooked ? "Booked" : "Available"}
        </span>
      </div>

      {!slot.isBooked && (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(slot)}
            className="flex-1 flex items-center justify-center"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(slot.id)}
            className="flex-1 flex items-center justify-center text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
};

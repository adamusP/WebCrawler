import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import styles from "./WebEntryModal.module.css";

export interface WebEntryFormData {
  label: string;
  url: string;
  boundaryRegexp: string;
  periodicity: "MINUTE" | "HOUR" | "DAY" | "NONE";
  tagsString: string; //comma-separated string of tags
  active: boolean;
}

interface WebEntryModalProps {
  onClose: () => void;
  onSave: (data: WebEntryFormData) => void;
  initialData: Partial<WebEntryFormData> | null;
}

export default function WebEntryModal({ onClose, onSave, initialData }: WebEntryModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WebEntryFormData>({
    defaultValues: {
      periodicity: "HOUR",
      active: true,
      tagsString: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({ periodicity: "HOUR", active: true, tagsString: "" });
    }
  }, [initialData, reset]);

  const onSubmit = (data: WebEntryFormData) => {
    let finalUrl = data.url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    const normalizedData = {
      ...data,
      url: finalUrl,
    };
    onSave(normalizedData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{initialData ? "Edit Website Record" : "Add New Record"}</h3>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.formGroup}>
            <label>Label</label>
            <input
              {...register("label", { required: "Label is required" })}
              className={styles.input}
              placeholder="My Blog"
            />
            {errors.label && <span className={styles.error}>{errors.label.message}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>URL</label>
            <input
              {...register("url", {
                required: "URL is required",
                pattern: {
                  value:
                    /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
                  message: "Must be a valid URL (e.g., example.com or https://example.com)",
                },
              })}
              className={styles.input}
              placeholder="https://example.com"
            />
            {errors.url && <span className={styles.error}>{errors.url.message}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Boundary RegExp</label>
            <input
              {...register("boundaryRegexp", { required: "Boundary RegExp is required" })}
              className={styles.input}
              placeholder="^https://example\.com/.*"
            />
            {errors.boundaryRegexp && (
              <span className={styles.error}>{errors.boundaryRegexp.message}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Periodicity</label>
            <select {...register("periodicity")} className={styles.select}>
              <option value="MINUTE">Minute</option>
              <option value="HOUR">Hour</option>
              <option value="DAY">Day</option>
              <option value="NONE">None</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Tags (comma separated)</label>
            <input
              {...register("tagsString")}
              className={styles.input}
              placeholder="news, tech, frontend"
            />
          </div>

          <div className={styles.checkboxGroup}>
            <input type="checkbox" id="active" {...register("active")} />
            <label htmlFor="active">Active (periodic scheduling)</label>
          </div>

          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton}>
              {initialData ? "Save Changes" : "Create Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

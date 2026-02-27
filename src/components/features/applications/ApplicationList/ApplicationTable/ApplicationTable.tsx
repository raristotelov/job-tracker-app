import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils/formatDate";
import type { ApplicationWithSection, Section } from "@/types";
import styles from "./ApplicationTable.module.scss";

interface ApplicationTableProps {
  applications: ApplicationWithSection[];
  sections: Section[];
  onEditClick: (
    application: ApplicationWithSection,
    buttonEl: HTMLButtonElement,
  ) => void;
  onDeleteClick: (application: ApplicationWithSection) => void;
  onRowClick: (application: ApplicationWithSection) => void;
}

/**
 * Renders a table of job applications.
 *
 * Each row is a clickable link to the application's detail page.
 * Each row also has an "Edit" button in the Actions column that opens the
 * inline edit drawer without navigating away from the list.
 * Optional fields that are null are shown as an em dash.
 * Text that overflows a cell is truncated with an ellipsis.
 */
export function ApplicationTable({
  applications,
  sections: _sections,
  onEditClick,
  onDeleteClick,
  onRowClick,
}: ApplicationTableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Section</th>
            <th className={styles.th}>Company</th>
            <th className={styles.th}>Position</th>
            <th className={styles.th}>Location</th>
            <th className={styles.th}>Status</th>
            <th className={styles.th}>Date Applied</th>
            <th className={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr
              key={app.id}
              className={styles.row}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${app.position_title} at ${app.company_name}`}
              onClick={() => onRowClick(app)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRowClick(app);
                }
              }}
            >
              <td className={styles.td}>
                <span className={styles.rowLink}>
                  <span className={`${styles.cellText} ${styles.muted}`}>
                    {app.sections?.name ?? (
                      <span className={styles.placeholder}>—</span>
                    )}
                  </span>
                </span>
              </td>
              <td className={styles.td}>
                <span className={styles.rowLink}>
                  <span className={styles.cellText}>{app.company_name}</span>
                </span>
              </td>
              <td className={styles.td}>
                <span className={styles.rowLink}>
                  <span className={styles.cellText}>{app.position_title}</span>
                </span>
              </td>
              <td className={styles.td}>
                <span className={styles.rowLink}>
                  <span className={`${styles.cellText} ${styles.muted}`}>
                    {app.location ?? (
                      <span className={styles.placeholder}>—</span>
                    )}
                  </span>
                </span>
              </td>
              <td className={styles.td}>
                <span className={styles.rowLink}>
                  <StatusBadge status={app.status} />
                </span>
              </td>
              <td className={styles.td}>
                <span className={styles.rowLink}>
                  <span className={`${styles.cellText} ${styles.muted}`}>
                    {formatDate(app.date_applied)}
                  </span>
                </span>
              </td>
              <td className={styles.td}>
                <span className={`${styles.rowLink} ${styles.actionButtons}`}>
                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick(app, e.currentTarget);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClick(app);
                    }}
                  >
                    Delete
                  </button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

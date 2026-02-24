import type { SectionWithCount } from '@/types';
import { SectionItem } from './SectionItem';
import styles from './SectionList.module.scss';

interface SectionListProps {
  sections: SectionWithCount[];
}

/**
 * Renders the list of sections on the management page.
 *
 * This is a Server Component — it receives pre-fetched sections from the page
 * and renders them as a `<ul>`. Each section is a `SectionItem` Client
 * Component that handles inline rename and delete interactions.
 *
 * Empty state is handled in the parent page so this component always receives
 * at least one section.
 */
export function SectionList({ sections }: SectionListProps) {
  return (
    <ul className={styles.list} aria-label="Sections">
      {sections.map((section) => (
        <SectionItem key={section.id} section={section} />
      ))}
    </ul>
  );
}

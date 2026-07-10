import type { ReactNode } from "react";
import type { ComponentKind } from "../../../shared/api-types";

interface IconProps {
  size?: number;
}

const svg = (paths: ReactNode, size = 20) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {paths}
  </svg>
);

// --- concrete component types ---

const SyslogIcon = ({ size }: IconProps) =>
  svg(
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 9h8M6 12.5h12M6 16h5" />
    </>,
    size
  );

const MqttIcon = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M5 19a10 10 0 0 1 10-10" />
      <path d="M5 13a4 4 0 0 1 4-4" transform="translate(0 6)" />
      <path d="M5 5a14 14 0 0 1 14 14" />
      <circle cx="5.5" cy="18.5" r="1.2" fill="currentColor" />
    </>,
    size
  );

const GaugeIcon = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M4 18a9 9 0 1 1 16 0" />
      <path d="M12 13l4-4" />
      <circle cx="12" cy="14" r="1.4" fill="currentColor" />
    </>,
    size
  );

const RemapIcon = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M8 4c-2 0-2.5 1-2.5 3S5 10.5 3.5 12C5 13.5 5.5 15 5.5 17s.5 3 2.5 3" />
      <path d="M16 4c2 0 2.5 1 2.5 3s.5 3.5 2 5c-1.5 1.5-2 3-2 5s-.5 3-2.5 3" />
    </>,
    size
  );

const RouteIcon = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M3 12h6" />
      <path d="M9 12c3 0 3-5 6-5h5" />
      <path d="M9 12c3 0 3 5 6 5h5" />
      <path d="M17 4.5L20 7l-3 2.5M17 14.5L20 17l-3 2.5" />
    </>,
    size
  );

const ElasticsearchIcon = ({ size }: IconProps) =>
  svg(
    <>
      <circle cx="10" cy="10" r="6" />
      <path d="M14.5 14.5L21 21" />
      <path d="M7 10h6M10 7v6" strokeWidth="1.4" />
    </>,
    size
  );

const ConsoleIcon = ({ size }: IconProps) =>
  svg(
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 9l4 3-4 3M12 15h6" />
    </>,
    size
  );

const PrometheusIcon = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M12 3c1 3-3 4.5-3 8a3 3 0 0 0 6 0c0-2 -1-3-1-3s3 1.5 3 5a5 5 0 0 1-10 0" />
      <path d="M8 20h8" />
    </>,
    size
  );

// --- kind fallbacks ---

const SourceFallbackIcon = ({ size }: IconProps) =>
  svg(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8M13 9l3 3-3 3" />
    </>,
    size
  );

const TransformFallbackIcon = ({ size }: IconProps) =>
  svg(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
    </>,
    size
  );

const SinkFallbackIcon = ({ size }: IconProps) =>
  svg(
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </>,
    size
  );

type IconComponent = (props: IconProps) => ReactNode;

const BY_TYPE: Record<string, IconComponent> = {
  syslog: SyslogIcon,
  mqtt: MqttIcon,
  internal_metrics: GaugeIcon,
  remap: RemapIcon,
  route: RouteIcon,
  elasticsearch: ElasticsearchIcon,
  console: ConsoleIcon,
  prometheus_exporter: PrometheusIcon,
};

const BY_KIND: Record<ComponentKind, IconComponent> = {
  source: SourceFallbackIcon,
  transform: TransformFallbackIcon,
  sink: SinkFallbackIcon,
};

export function getIcon(type: string, kind: ComponentKind, size = 20): ReactNode {
  const Icon = BY_TYPE[type] ?? BY_KIND[kind];
  return <Icon size={size} />;
}

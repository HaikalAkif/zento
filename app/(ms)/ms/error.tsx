'use client';

import { ErrorView, type ErrorProps } from '@/app/_views/error';

export default function Error(props: ErrorProps) {
  return <ErrorView {...props} />;
}

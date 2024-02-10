import PageLayout from "../PageLayout";

export default function Loading(
  name: string,
  isLoading: boolean,
  error: Error | undefined,
) {
  return (
    <PageLayout title="py.wtf">
      <div>
        {isLoading && <div>Loading...</div>}
        {error && (
          <div>
            Failed to load <code>{name}</code>: {error.message}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

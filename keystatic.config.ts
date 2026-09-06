import { config, fields, collection } from '@keystatic/core';

const categoryOptions = [
  { label: 'Home services', value: 'home-services' },
  { label: 'Senior care', value: 'senior-care' },
  { label: 'Retail / resale', value: 'retail-resale' },
  { label: 'Auto', value: 'auto' },
  { label: 'Food / hospitality', value: 'food-hospitality' },
  { label: 'Business services', value: 'business-services' },
  { label: 'Health / wellness', value: 'health-wellness' },
  { label: 'Real estate ops', value: 'real-estate-ops' },
  { label: 'Education', value: 'education' },
  { label: 'Other', value: 'other' },
] as const;

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Ready', value: 'ready' },
  { label: 'Published', value: 'published' },
] as const;

const buyerTypeOptions = [
  { label: 'Corporate escape planner', value: 'corporate-escape-planner' },
  { label: 'Family flexibility buyer', value: 'family-flexibility-buyer' },
  { label: 'Operator without idea', value: 'operator-without-idea' },
  { label: 'Deal searcher', value: 'deal-searcher' },
  { label: 'Existing owner (scale)', value: 'existing-owner-scale' },
] as const;

const sourceTypeOptions = [
  { label: 'YouTube', value: 'youtube' },
  { label: 'Newsletter', value: 'newsletter' },
  { label: 'Podcast', value: 'podcast' },
  { label: 'Research', value: 'research' },
  { label: 'Other', value: 'other' },
] as const;

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    models: collection({
      label: 'Business models',
      slugField: 'title',
      path: 'src/content/models/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        slug: fields.text({
          label: 'URL slug',
          description: 'kebab-case; must match the filename (e.g. roofing). Required by publish SCHEMA.',
          validation: { isRequired: true },
        }),
        description: fields.text({
          label: 'Description',
          description: 'SEO / card blurb (~120–160 chars), education tone',
          multiline: true,
          validation: { isRequired: true, length: { max: 220 } },
        }),
        category: fields.select({
          label: 'Category',
          options: [...categoryOptions],
          defaultValue: 'home-services',
        }),
        status: fields.select({
          label: 'Status',
          options: [...statusOptions],
          defaultValue: 'draft',
        }),
        publish: fields.checkbox({
          label: 'Publish',
          description: 'Site ships only publish: true with status ready|published',
          defaultValue: false,
        }),
        readMinutes: fields.integer({
          label: 'Read minutes',
          defaultValue: 10,
          validation: { isRequired: true, min: 1, max: 60 },
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'Tag',
        }),
        buyerTypes: fields.array(
          fields.select({
            label: 'Buyer type',
            options: [...buyerTypeOptions],
            defaultValue: 'operator-without-idea',
          }),
          {
            label: 'Buyer types',
            itemLabel: (props) => props.value || 'Buyer type',
          }
        ),
        relatedSlugs: fields.array(fields.text({ label: 'Related slug' }), {
          label: 'Related model slugs',
          itemLabel: (props) => props.value || 'slug',
        }),
        sources: fields.array(
          fields.object({
            title: fields.text({ label: 'Title', validation: { isRequired: true } }),
            url: fields.url({ label: 'URL' }),
            type: fields.select({
              label: 'Type',
              options: [...sourceTypeOptions],
              defaultValue: 'other',
            }),
          }),
          {
            label: 'Sources',
            itemLabel: (props) => props.fields.title.value || 'Source',
          }
        ),
        cta: fields.text({
          label: 'CTA',
          description: 'Default soft-ownership-path — never earnings CTAs',
          defaultValue: 'soft-ownership-path',
        }),
        updated: fields.date({ label: 'Updated' }),
        content: fields.markdoc({
          label: 'Content',
          extension: 'md',
        }),
      },
    }),
  },
});

import { PackageData, Reason } from '../../types.js';

const UNMAINTAINED_TOPICS = [
  'unmaintained',
  'abandoned',
  'no-maintenance-intended',
  'unmaintained-dont-use',
];

export const unmaintainedTopicCheck = (data: PackageData): Reason | null => {
  const topic = data.topics.find((topic) => UNMAINTAINED_TOPICS.includes(topic));
  if (topic) {
    return {
      check: 'topic',
      detail: `${data.name}'s repository is tagged with the "${topic}" topic.`,
      confidence: 'hard',
    };
  }
  return null;
};

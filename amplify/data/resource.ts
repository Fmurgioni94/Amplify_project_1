import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  studentInfo: a
    .model({
      id: a.id().required(),
      cognitivePower: a.float(),
      name: a.string(),
      availableHours: a.float(),
      programming: a.float(),
      writing: a.float(),
      analysis: a.float(),
      testing: a.float(),
      design: a.float(),
      documentation: a.float(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
  
  studentTasks: a.model({
    id: a.id().required(),
    nameOfTheTask: a.string(),
    description: a.string(),
    dependencies: a.integer().array(),
    estimatedDuration: a.integer(),
  })
  .authorization((allow) => [allow.publicApiKey()]),
});



export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
  },
});
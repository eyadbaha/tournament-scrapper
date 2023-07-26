FROM public.ecr.aws/lambda/nodejs:18 as development

WORKDIR /app
COPY package*.json /app
RUN npm install
COPY . . 
RUN npm run build
CMD [ "npm","run","dev" ]


FROM public.ecr.aws/lambda/nodejs:18 as test
WORKDIR ${LAMBDA_TASK_ROOT}
COPY package*.json .
RUN npm install --omit=dev
COPY --from=development app/build ./build
COPY index.js .

FROM alpine:3.14 as production
WORKDIR /production
COPY --from=test var/task .
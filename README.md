# AWS S3 Cleanup task

Runs a cleanup process for S3 bucket.

Usage
``` yaml      
- name: Get date 30 days ago for S3 cleanup 
  id: date
  run: echo "::set-output name=date::$(date -v-30d  +'%Y-%m-%d')"

- name: Run cleanup
  uses: trustfractal/aws-s3-cleanup@v1.0
  with:
    bucket: my-bucket
    include: |
      src/**/*.js
      locale/**/*.po
    exclude: |
      vendor/*
    older_than: ${{steps.date.outputs.date}}
```

See [action.yml](action.yml) file for the full documentation of this action's inputs and outputs.

For matching, we are using [wildcard-match](https://www.npmjs.com/package/wildcard-match#usage) npm package.

## License Summary

This code is made available under the MIT license.

const core = require("@actions/core");
const AWS = require("aws-sdk");
const wmatch = require("wildcard-match");

const s3 = new AWS.S3();

const cleanArray = (value) => (value || [])
  .map(x => x.trim())
  .filter(x => x.length > 0)
  .map(wmatch);

const main = async () => {
  const bucket = core.getInput("bucket", { required: true });
  const dryRun = core.getBooleanInput("dry_run");
  
  const include = cleanArray(core.getMultilineInput("include"));
  const exclude = cleanArray(core.getMultilineInput("exclude"));
  
  let olderThan = core.getInput("older_than");
  if (olderThan) {
    olderThan = new Date(olderThan);

    if (olderThan.toString() === "Invalid Date") {
      core.setFailed("Invalid date provided fro older_than attribute.");
      throw new Error("Invalid date for older_than input.");
    }
  }

  core.debug("Iterate over files and test include, exclude filters and dates...");
  let isTruncated = true;
  let lastMarker = undefined;

  try {
    while (isTruncated) {
      const { Contents, ...rest } = await s3.listObjects({
        Bucket: bucket,
        Marker: lastMarker,
      }).promise();

      for (const item of Contents) {
        lastMarker = item.Key;

        // Is there any excluded filter for this key?
        const excluded = exclude.find(x => x(item.Key));
        if (excluded) {
          continue;
        }

        // Is include filter present and exists at least one match?
        if (include.length > 0 && !include.find(x => x(item.Key))) {
          continue;
        }

        // Older than is present, but the file is younger
        if (olderDate && item.LastModified.getTime() > olderDate.getTime()) {
          continue;
        }

        if (dryRun) {
          console.log(`-> Item ${item.Key} will be removed`);
        } else {
          await s3.deleteObject({
            Bucket: bucket,
            Key: item.Key,
          }).promise();
        }
      }

      isTruncated = rest.IsTruncated;

      if (rest.NextMarker) {
        lastMarker = rest.NextMarker;
      }
    }
  } catch (e) {
    core.setFailed(e);
  }
};

main();

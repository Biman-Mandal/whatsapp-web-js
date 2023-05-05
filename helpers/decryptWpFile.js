
// Not DONE
const functionName = async(req, res)=>{

}

const decryptData = async(message: Message) => {
    const options = makeOptions(useragentOverride);
    message.clientUrl =
      message.clientUrl !== undefined
        ? message.clientUrl
        : message.deprecatedMms3Url;

    if (!message.clientUrl) {
      throw new Error(
        'message is missing critical data needed to download the file.'
      );
    }

    let haventGottenImageYet: boolean = true,
      res: any;
    try {
      while (haventGottenImageYet) {
        res = await axios.get(message.clientUrl.trim(), options);
        if (res.status == 200) {
          haventGottenImageYet = false;
        } else {
          await timeout(2000);
        }
      }
    } catch (error) {
      console.error(error);
      throw 'Error trying to download the file.';
    }
    const buff = Buffer.from(res.data, 'binary');
    return magix(buff, message.mediaKey, message.type, message.size);
  };

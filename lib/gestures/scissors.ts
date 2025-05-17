import * as fp from 'fingerpose';
const scissors = new fp.GestureDescription('scissors');
scissors.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
scissors.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
scissors.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
scissors.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
scissors.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.5);
export default scissors;
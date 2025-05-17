import * as fp from 'fingerpose';
const rock = new fp.GestureDescription('rock');
for (let finger of [fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
  rock.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
}
rock.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.5);
export default rock;

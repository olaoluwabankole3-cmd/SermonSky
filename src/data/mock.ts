export type Video = {
  id: string;
  title: string;
  church: string;
  views: string;
  age: string;
  duration: string;
  image: string;
  verified?: boolean;
  category: "Sermon" | "Worship" | "Bible Study" | "Youth";
};

export type Church = {
  id: string;
  name: string;
  handle: string;
  followers: string;
  image: string;
  verified: boolean;
};

export const heroVideo: Video = {
  id: "hero",
  title: "There Is a Bigger Story",
  church: "Elevation Church",
  views: "12K",
  age: "4 days ago",
  duration: "42:18",
  image:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=84",
  verified: true,
  category: "Sermon",
};

export const videos: Video[] = [
  {
    id: "1",
    title: "Walking in God's Promises",
    church: "New Life Church",
    views: "8.4K",
    age: "2 days ago",
    duration: "28:15",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=82",
    verified: true,
    category: "Sermon",
  },
  {
    id: "2",
    title: "Faith Over Fear",
    church: "Grace Church",
    views: "6.1K",
    age: "4 days ago",
    duration: "32:07",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=82",
    verified: true,
    category: "Bible Study",
  },
  {
    id: "3",
    title: "When God Seems Silent",
    church: "Elevation Church",
    views: "48K",
    age: "2 weeks ago",
    duration: "34:20",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=82",
    verified: true,
    category: "Sermon",
  },
  {
    id: "4",
    title: "Worship in the Waiting",
    church: "Passion City Church",
    views: "26K",
    age: "3 weeks ago",
    duration: "19:44",
    image:
      "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=900&q=82",
    verified: true,
    category: "Worship",
  },
  {
    id: "5",
    title: "Built for a Higher Purpose",
    church: "Kingdom House",
    views: "18K",
    age: "1 month ago",
    duration: "29:11",
    image:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=82",
    verified: true,
    category: "Youth",
  },
];

export const churches: Church[] = [
  {
    id: "c1",
    name: "Elevation Church",
    handle: "@elevationchurch",
    followers: "1.2M",
    image:
      "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=500&q=80",
    verified: true,
  },
  {
    id: "c2",
    name: "Grace Church",
    handle: "@gracechurch",
    followers: "438K",
    image:
      "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=500&q=80",
    verified: true,
  },
  {
    id: "c3",
    name: "New Life Church",
    handle: "@newlife",
    followers: "284K",
    image:
      "https://images.unsplash.com/photo-1504150558240-0b4fd8946624?auto=format&fit=crop&w=500&q=80",
    verified: true,
  },
];

export const categories = [
  "Sermons",
  "Worship",
  "Bible Study",
  "Youth",
  "Prayer",
  "Relationships",
];

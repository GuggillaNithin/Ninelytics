export interface MockLinkedInProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export interface MockLinkedInPage {
  id: string;
  name: string;
  logo: string;
}

export function getMockLinkedInProfile(): MockLinkedInProfile {
  return {
    id: "mock_user_123",
    name: "Nithin Guggilla",
    email: "nithinguggilla94@gmail.com",
    picture:
      "https://media.licdn.com/dms/image/v2/D5603AQF061Xqt-PD9g/profile-displayphoto-shrink_100_100/B56ZdnEulEGQAY-/0/1749780984330?e=1778716800&v=beta&t=olb9ag98i7lPi4lkdZuFaVTG5X2BjtYSux9W0Tlv8b4",
  };
}

export function getMockLinkedInPages(): MockLinkedInPage[] {
  return [
    {
      id: "org_1",
      name: "Ninelytics",
      logo:
        "https://media.licdn.com/dms/image/v2/D560BAQE77N-WtjRoqQ/company-logo_100_100/B56Z0RRdGxJkAQ-/0/1774111282067/unified_metrics_logo?e=1778716800&v=beta&t=JE63rfKyHXTA4rfE894ydWDtvo-2zEBOVwwc0stZfFk",
    },
  ];
}

import { Truck, CheckCircle, Headset, Phone, MessageCircle } from "lucide-react";

const sidePanelData = [
    { id: 1, title: "Fast Delivery", description: "Free Delivery within valley", icon: <Truck /> },
    { id: 2, title: "Genuine Products", description: "100% genuine products", icon: <CheckCircle /> },
    { id: 3, title: "Warranty Support", description: "Support available", icon: <Headset /> },
];

export default function InfoPanel() {
    return (
        <div className="flex flex-col h-full gap-2">
            {sidePanelData.map((item) => (
                <div
                    key={item.id}
                    className="flex items-center p-2 bg-white rounded-sm border border-gray-200 w-full flex-1"
                >
                    <div className="w-10 h-10 text-blue-700 flex items-center justify-center">
                        {item.icon}
                    </div>
                    <div className="flex flex-col ml-2">
                        <h2 className="text-sm font-semibold">{item.title}</h2>
                        <p className="text-gray-600 text-xs">{item.description}</p>
                    </div>
                </div>
            ))}


            <div className="flex items-center p-2 bg-white rounded-sm border border-gray-200 w-full flex-1">
                {/* Phone section (left) */}
                <div className="flex items-center gap-2 flex-1 ms-3">
                    <Phone className="w-5 h-5 text-blue-700" />
                    <span className="ms-2 text-sm font-semibold">89184218</span>
                </div>

                {/* Divider */}
                <div className="w-px bg-gray-300 h-full mx-3"></div>

                {/* Chat section (right) */}
                <div className="flex items-center gap-2 flex-1 pl-2">
                    <MessageCircle className="w-5 h-5 text-blue-700" />
                    <span className="text-sm font-semibold">Chat with us</span>
                </div>
            </div>




        </div>
    );
}

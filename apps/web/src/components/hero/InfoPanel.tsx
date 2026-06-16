import { Truck, CheckCircle, Headset, Phone, MessageCircle } from "lucide-react";

const sidePanelData = [
    { id: 1, title: "Fast Delivery", description: "Free Delivery within valley", icon: Truck },
    { id: 2, title: "Genuine Products", description: "100% genuine products", icon: CheckCircle },
    { id: 3, title: "Warranty Support", description: "Support available", icon: Headset },
];

export default function InfoPanel() {
    return (
        <div className="flex flex-col h-full gap-2">
            {sidePanelData.map((item) => {
                const Icon = item.icon;
                return (
                    <div
                        key={item.id}
                        className="flex items-center p-2 bg-white rounded-sm border border-gray-200 w-full flex-1"
                    >
                        <div className="w-10 h-10 text-[#083d6e] flex items-center justify-center">
                            <Icon className="w-6 h-6" />
                        </div>
                        <div className="w-px bg-gray-200 self-stretch mx-2" />
                        <div className="flex flex-col ml-2">
                            <h2 className="text-sm font-semibold text-gray-900">{item.title}</h2>
                            <p className="text-gray-500 text-xs">{item.description}</p>
                        </div>
                    </div>
                );
            })}

            <div className="flex items-center p-2 bg-white rounded-sm border border-gray-200 w-full flex-1">
                <div className="flex items-center gap-2 flex-1 ms-3">
                    <Phone className="w-5 h-5 text-[#083d6e]" />
                    <div className="w-px bg-gray-200 self-stretch mx-2" />
                    <span className="text-sm font-semibold text-gray-900">89184218</span>
                </div>

                <div className="w-px bg-gray-300 h-full mx-3"></div>

                <div className="flex items-center gap-2 flex-1 pl-2">
                    <MessageCircle className="w-5 h-5 text-[#083d6e]" />
                    <div className="w-px bg-gray-200 self-stretch mx-2" />
                    <span className="text-sm font-semibold text-gray-900">Chat with us</span>
                </div>
            </div>
        </div>
    );
}

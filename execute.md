# GIVE ME THE CODE in chat message. DO NOT EDIT MY CODE

/_ -------- reverse lookups: profile id → User.id (for emit targeting) ------- _/

//TechnicianProfile.id → User.id
export const getUserIdByTechnicianProfileId = async (
technicianProfileId: string,
): Promise<string | null> => {
const profile = await prisma.technicianProfile.findUnique({
where: { id: technicianProfileId },
select: { userId: true },
});
return profile?.userId ?? null;
};

//CustomerProfile.id → User.id
export const getUserIdByCustomerProfileId = async (
customerProfileId: string,
): Promise<string | null> => {
const profile = await prisma.customerProfile.findUnique({
where: { id: customerProfileId },
select: { userId: true },
});
return profile?.userId ?? null;
};
amra ai reverse look up krbona rather amra dkho create booking er mddhe service er mddhe select e technican er user id tao nie nissi same kaj tai amra krbo sob khane so eta follow krba and amader atfirst amra booking realted notification gula thik kri. amra notification oodule e onk kisur kaj kref elsi so oita dkho dkhe sudu remaining code e diba also amader jkhn new select field add hsse that means hte pare j amader booking mapper e kono error aste pare so oita check krba dn amader schema gula dkhe akta idea nao j konta kivave connected erpor amader notification module er remaining code gula dao and booking e seta kiavev use kora jai seta dao. also | Event | Customer | Technician | Admin |
| --------------------------------------- | ----------------------------------------------- | ---------------------------------------------- | --------------------------------------------------- |
| **Customer creates booking request** | ❌ | ✅ **New booking request received** | ✅ **New booking request created by {customerName}** |
| **Technician accepts booking** | ✅ **Your booking has been accepted** | ❌ | ✅ **Booking accepted by {technicianName}** |
| **Technician declines booking** | ✅ **Your booking request was declined** | ❌ | ✅ **Booking declined by {technicianName}** |
| **Customer completes payment** | ✅ **Payment successful** | ✅ **Payment received. You can start the job.** | ✅ **Payment received for booking #{id}** |
| **Technician marks In Progress** | ✅ **Your service is now in progress** | ❌ | ✅ **Booking moved to In Progress** |
| **Technician marks Completed** | ✅ **Service completed. Please leave a review.** | ❌ | ✅ **Booking completed** |
| **Customer submits review** _(Pending)_ | ❌ | ❌ | ✅ **A new review is awaiting approval** |
| **Admin publishes review** | ✅ **Your review has been published** | ✅ **You received a new review** | ❌ |
ai hsse amader booking er notification criteria. like sob action er notification e admin er kase jabe likhe dhoro user booking req krlo, then tech accept krlo, dn user pay krlo, then tech in progress krlo dn tech complete krlo agula sob kisur noti admin pabe. user pabe sudu technican aikahne j action gula krse, technican pabe, req er ta, dn pabe jkhn user pay kre dise tkhn se pabe new work added amn typ notification, erpor r kisu pabena dn user jkhn abr review dibe complete hbar por seta pending thake tkhn admin akta notif pabe j akta review asche then se review publish krle customer pabe review published and techn pabe a new review is given or some releavnt tect bujte parso? GIVE ME THE CODE HERE. DONOT EDIT MY CODE

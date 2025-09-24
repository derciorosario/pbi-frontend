// src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { toast } from "../lib/toast";

import {
  getMe,
  updatePersonal,
  updateProfessional,
  updatePortfolio,
  updateAvailability,
  getWorkSamples,
  createWorkSample,
  updateWorkSample,
  deleteWorkSample,
  getIdentityCatalog,
  updateDoSelections,
  updateInterestSelections,
  updateIndustrySelections,
} from "../api/profile";

import { getUserById, updateUser } from "../api/admin";
import client from "../api/client";
import ProfilePhoto from "../components/ProfilePhoto";
import COUNTRIES from "../constants/countries.js";
import Header from "../components/Header.jsx";
import UserSelectionModal from "../components/UserSelectionModal";
 import StaffInvitationModal from "../components/StaffInvitationModal";
 import OrganizationSelectionModal from "../components/OrganizationSelectionModal";
import { useAuth } from "../contexts/AuthContext.jsx";

const Tab = {
  PERSONAL: "personal",
  PROFESSIONAL: "professional",
  PORTFOLIO: "portfolio",
  DO: "do",
  INTERESTS: "interests",
  INDUSTRIES: "industries",
  REPRESENTATIVE: "representative",
  STAFF: "staff",
  ORGANIZATIONS: "organizations",
  JOIN_REQUESTS: "join_requests",
  APPLICATIONS: "applications",
  EVENTS: "events",
  JOB_APPLICATIONS: "job_applications",
  EVENT_REGISTRATIONS: "event_registrations",
};

export default function ProfilePage() {
  const { id: userId } = useParams();
  const location = useLocation();
  const isAdminEditing = location.pathname.includes('/admin/user-profile/');
  const {user} = useAuth() 
  
  const [active, setActive]   = useState(Tab.PERSONAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [me, setMe]           = useState(null);
  const [identities, setIdentities] = useState([]);

  useEffect(()=>{

    if(!me || !user) return

    if(user?.id != me?.user?.id && user?.accountType!="admin"){
      window.location.reload()
    }

  },[user,me])
  
  // Determine if this is a company account
  const isCompany = me?.user?.accountType === "company";

  // Personal
  const [personal, setPersonal] = useState({
    name: "", phone: "", nationality: "",
    country: "", countryOfResidence: "", city: "",
    birthDate: "", professionalTitle: "", about: "", avatarUrl: "",
    // Individual fields
    gender: "",
    // Company fields
    otherCountries: [],
    webpage: ""
  });

  // Professional (no categories here)
  const [professional, setProfessional] = useState({
    experienceLevel: "",
    skills: [],
    languages: [],
  });

  // Portfolio
  const [portfolio, setPortfolio] = useState({
    cvBase64: "",
    cvFileName: "",
    workSamples: [],
  });
  const [workSamples, setWorkSamples] = useState([]);

  // Availability
  const [isOpenToWork, setIsOpenToWork] = useState(false);

  // Work sample form state
  const [editingSample, setEditingSample] = useState(null);
  const [showSampleForm, setShowSampleForm] = useState(false);
  const [sampleForm, setSampleForm] = useState({
    title: "",
    description: "",
    projectUrl: "",
    skillsTags: [],
    attachments: [],
  });
  const [skillTagInput, setSkillTagInput] = useState("");
  const [attachmentTitle, setAttachmentTitle] = useState("");
  const [editingAttachmentTitle, setEditingAttachmentTitle] = useState(null);

  // DOES (what I DO)
  const [doIdentityIds, setDoIdentityIds] = useState([]);
  const [doCategoryIds, setDoCategoryIds] = useState([]);
  const [doSubcategoryIds, setDoSubcategoryIds] = useState([]);
  const [doSubsubCategoryIds, setDoSubsubCategoryIds] = useState([]);

  // WANTS (what I’m looking for) + limits
  const MAX_WANT_IDENTITIES = 3;
  const MAX_WANT_CATEGORIES = 3;
  const [wantIdentityIds, setWantIdentityIds] = useState([]);
  const [wantCategoryIds, setWantCategoryIds] = useState([]);
  const [wantSubcategoryIds, setWantSubcategoryIds] = useState([]);
  const [wantSubsubCategoryIds, setWantSubsubCategoryIds] = useState([]);

  // INDUSTRIES
  const [industries, setIndustries] = useState([]);
  const [industryCategoryIds, setIndustryCategoryIds] = useState([]);
  const [industrySubcategoryIds, setIndustrySubcategoryIds] = useState([]);
  const [industrySubsubCategoryIds, setIndustrySubsubCategoryIds] = useState([]);

  // UI open/close (DO / WANT)
  const [openCatsDo, setOpenCatsDo] = useState(() => new Set());
  const [openSubsDo, setOpenSubsDo] = useState(() => new Set());
  const [openCatsWant, setOpenCatsWant] = useState(() => new Set());
  const [openSubsWant, setOpenSubsWant] = useState(() => new Set());

  // UI open/close for industries
  const [openIndustryCats, setOpenIndustryCats] = useState(() => new Set());
  const [openIndustrySubs, setOpenIndustrySubs] = useState(() => new Set());

  // Company management state
   const [representatives, setRepresentatives] = useState([]);
   const [staff, setStaff] = useState([]);
   const [showRepresentativeModal, setShowRepresentativeModal] = useState(false);
   const [showStaffModal, setShowStaffModal] = useState(false);
   const [currentRepresentative, setCurrentRepresentative] = useState(null);
   const [pendingInvitations, setPendingInvitations] = useState([]);
   const [incomingInvitations, setIncomingInvitations] = useState([]);
   const [loadingInvitations, setLoadingInvitations] = useState(false);
   const [sendingRepresentativeInvite, setSendingRepresentativeInvite] = useState(false);
   const [sendingStaffInvite, setSendingStaffInvite] = useState(false);
   const [editingStaff, setEditingStaff] = useState(null);
   const [editingRole, setEditingRole] = useState('');

   // Organization membership state
   const [showOrganizationModal, setShowOrganizationModal] = useState(false);
   const [membershipStatus, setMembershipStatus] = useState(null);
   const [loadingMembership, setLoadingMembership] = useState(false);

   // Organization join requests state (for companies)
   const [organizationJoinRequests, setOrganizationJoinRequests] = useState([]);
   const [loadingJoinRequests, setLoadingJoinRequests] = useState(false);
   const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

   // Profile applications state
   const [jobApplications, setJobApplications] = useState([]);
   const [eventRegistrations, setEventRegistrations] = useState([]);
   const [loadingApplications, setLoadingApplications] = useState(false);
   const [loadingEvents, setLoadingEvents] = useState(false);

   // Individual applications and events state
   const [individualJobApplications, setIndividualJobApplications] = useState([]);
   const [individualEventRegistrations, setIndividualEventRegistrations] = useState([]);
   const [loadingIndividualApplications, setLoadingIndividualApplications] = useState(false);
   const [loadingIndividualEvents, setLoadingIndividualEvents] = useState(false);

   // Profile applications state for individuals
   const [myJobApplications, setMyJobApplications] = useState([]);
   const [myEventRegistrations, setMyEventRegistrations] = useState([]);
   const [loadingMyApplications, setLoadingMyApplications] = useState(false);
   const [loadingMyEvents, setLoadingMyEvents] = useState(false);

  // Load company representatives and staff
   useEffect(() => {
     if (isCompany && me?.user?.id) {
       loadCompanyData();
     }
   }, [isCompany, me?.user?.id]);

   // Load organization membership status for individual users
   useEffect(() => {
     if (!isCompany && me?.user?.id) {
       loadMembershipStatus();
     }
   }, [isCompany, me?.user?.id]);

   // Load organization join requests for companies
    useEffect(() => {
      if (isCompany && me?.user?.id) {
        loadOrganizationJoinRequests();
        loadPendingRequestsCount();
      }
    }, [isCompany, me?.user?.id]);

    // Load job applications for companies
    useEffect(() => {
      if (isCompany && me?.user?.id && active === Tab.JOB_APPLICATIONS) {
        loadJobApplications();
      }
    }, [isCompany, me?.user?.id, active]);

    // Load event registrations for companies
    useEffect(() => {
      if (isCompany && me?.user?.id && active === Tab.EVENT_REGISTRATIONS) {
        loadEventRegistrations();
      }
    }, [isCompany, me?.user?.id, active]);

    // Load individual job applications
    useEffect(() => {
      if (!isCompany && me?.user?.id && active === Tab.APPLICATIONS) {
        loadIndividualJobApplications();
      }
    }, [isCompany, me?.user?.id, active]);

    // Load individual event registrations
    useEffect(() => {
      if (!isCompany && me?.user?.id && active === Tab.EVENTS) {
        loadIndividualEventRegistrations();
      }
    }, [isCompany, me?.user?.id, active]);

    // Load my applications for individuals
    useEffect(() => {
      if (!isCompany && me?.user?.id && active === Tab.APPLICATIONS) {
        loadMyApplications();
      }
    }, [!isCompany, me?.user?.id, active]);

    // Load my events for individuals
    useEffect(() => {
      if (!isCompany && me?.user?.id && active === Tab.EVENTS) {
        loadMyEventRegistrations();
      }
    }, [!isCompany, me?.user?.id, active]);

  async function loadCompanyData() {
    try {
      // Load company representatives
      const repResponse = await client.get('/company/representatives');
      if (repResponse.data?.representatives) {
        setRepresentatives(repResponse.data.representatives);
        // Set current representative if exists
        const activeRep = repResponse.data.representatives.find(r => r.status === 'authorized');
        if (activeRep) {
          setCurrentRepresentative(activeRep);
        }
      }

      // Load company staff
      const staffResponse = await client.get('/company/staff');
      if (staffResponse.data?.staff) {
        setStaff(staffResponse.data.staff);
      }

      // Load pending invitations (for representatives)
      try {
        const invitationsResponse = await client.get('/company/invitations?type=representative&status=sent');
        if (invitationsResponse.data?.invitations) {
          setPendingInvitations(invitationsResponse.data.invitations);
        }
      } catch (invitationError) {
        // Invitations endpoint might not exist yet, that's okay
        console.log('Invitations endpoint not available yet');
      }

      // Load incoming invitations (invitations sent TO this company)
      try {
        const incomingResponse = await client.get('/company/invitations?type=representative&status=pending&direction=incoming');
        if (incomingResponse.data?.invitations) {
          setIncomingInvitations(incomingResponse.data.invitations);
        }
      } catch (incomingError) {
        // Incoming invitations endpoint might not exist yet, that's okay
        console.log('Incoming invitations endpoint not available yet');
      }
    } catch (error) {
      console.error('Failed to load company data:', error);
    }
  }

  // Handle representative selection
   async function handleRepresentativeSelected(user) {
     try {
       setShowRepresentativeModal(false);
       setSendingRepresentativeInvite(true);

       // Show loading toast
       toast.loading('Sending authorization request...', { id: 'representative-invite' });

       console.log('Sending representative invitation for user:', user.id);
       const response = await client.post('/company/representative/invite', {
         companyId: me.user.id,
         representativeId: user.id
       });

       console.log('Representative invitation response:', response.data);

       console.log({a:response.data})

       if (response.data.invitation) {
         toast.success('Authorization request sent to user', { id: 'representative-invite' });
         console.log('Toast success called');
         // Reload company data to show pending request
         loadCompanyData();
       } else {
         toast.error('Failed to send authorization request', { id: 'representative-invite' });
       }
     } catch (error) {
       console.error('Failed to send representative request:', error);

       // Show user-friendly error messages based on backend response
       if (error.response?.data?.message) {
         const backendMessage = error.response.data.message;

         if (backendMessage.includes('already sent')) {
           toast.error('An invitation has already been sent to this user. Please wait for their response or try a different user.', { id: 'representative-invite' });
         } else if (backendMessage.includes('already a representative')) {
           toast.error('This user is already a representative for your company.', { id: 'representative-invite' });
         } else if (backendMessage.includes('Only companies can')) {
           toast.error('Only company accounts can invite representatives.', { id: 'representative-invite' });
         } else if (backendMessage.includes('Invalid representative')) {
           toast.error('This user cannot be selected as a representative.', { id: 'representative-invite' });
         } else {
           toast.error(`Authorization request failed: ${backendMessage}`, { id: 'representative-invite' });
         }
       } else {
         toast.error('Failed to send authorization request. Please try again.', { id: 'representative-invite' });
       }
     } finally {
       setSendingRepresentativeInvite(false);
     }
   }

  // Handle staff invitation
   async function handleStaffInvited(invitation) {
     try {
       setSendingStaffInvite(true);

       // Show loading toast
       toast.loading('Sending staff invitation...', { id: 'staff-invite' });

       // The invitation is already sent by the modal, just reload data
       toast.success('Staff invitation sent successfully', { id: 'staff-invite' });

       // Reload company data to show new invitation
       loadCompanyData();
     } catch (error) {
       console.error('Failed to handle staff invitation:', error);
       toast.error('Failed to process staff invitation', { id: 'staff-invite' });
     } finally {
       setSendingStaffInvite(false);
     }
   }

  // Handle staff removal
  async function handleRemoveStaff(staffId) {
    try {
      const response = await client.delete(`/company/staff/${staffId}`);

      if (response.data) {
        toast.success('Staff member removed successfully');
        // Reload company data
        loadCompanyData();
      }
    } catch (error) {
      console.error('Failed to remove staff member:', error);
      toast.error('Failed to remove staff member');
    }
  }

  // Handle staff role update
  async function handleUpdateStaffRole(staffRecordId, newRole) {
    try {
      const response = await client.put(`/company/staff/${staffRecordId}`, {
        role: newRole
      });

      if (response.data) {
        toast.success('Staff role updated successfully');
        // Reload company data
        loadCompanyData();
        setEditingStaff(null);
        setEditingRole('');
      }
    } catch (error) {
      console.error('Failed to update staff role:', error);
      toast.error('Failed to update staff role');
    }
  }

  // Start editing staff role
  function startEditingStaff(staffMember) {
    setEditingStaff(staffMember.id);
    setEditingRole(staffMember.role);
  }

  // Cancel editing staff role
  function cancelEditingStaff() {
    setEditingStaff(null);
    setEditingRole('');
  }

  // Handle representative removal/revocation
  async function handleRemoveRepresentative() {
    try {
      const response = await client.delete(`/company/representative/${currentRepresentative.representativeId}`);

      if (response.data) {
        toast.success('Representative authorization revoked successfully');
        // Clear current representative and reload data
        setCurrentRepresentative(null);
        loadCompanyData();
      }
    } catch (error) {
      console.error('Failed to remove representative:', error);
      toast.error('Failed to remove representative');
    }
  }

  // Handle invitation cancellation
  async function handleCancelInvitation(invitationId) {
    try {
      setLoadingInvitations(true);
      const response = await client.put(`/company/invitations/${invitationId}/cancel`);

      if (response.data) {
        toast.success('Invitation cancelled successfully');
        // Reload invitations data
        loadCompanyData();
      }
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      toast.error('Failed to cancel invitation');
    } finally {
      setLoadingInvitations(false);
    }
  }

  // Handle invitation resend
   async function handleResendInvitation(invitationId) {
     try {
       setLoadingInvitations(true);
       const response = await client.put(`/company/invitations/${invitationId}/resend`);

       if (response.data) {
         toast.success('Invitation resent successfully');
         // Reload invitations data
         loadCompanyData();
       }
     } catch (error) {
       console.error('Failed to resend invitation:', error);
       toast.error('Failed to resend invitation');
     } finally {
       setLoadingInvitations(false);
     }
   }

   // Handle accepting incoming representative invitation
   async function handleAcceptIncomingInvitation(invitationId) {
     try {
       setLoadingInvitations(true);
       const response = await client.put(`/company/invitations/${invitationId}/accept`);

       if (response.data) {
         toast.success('Representative request accepted successfully');
         // Reload company data to show new representative
         loadCompanyData();
       }
     } catch (error) {
       console.error('Failed to accept invitation:', error);
       toast.error('Failed to accept representative request');
     } finally {
       setLoadingInvitations(false);
     }
   }

   // Handle rejecting incoming representative invitation
   async function handleRejectIncomingInvitation(invitationId) {
     try {
       setLoadingInvitations(true);
       const response = await client.put(`/company/invitations/${invitationId}/reject`);

       if (response.data) {
         toast.success('Representative request rejected');
         // Reload company data to remove rejected invitation
         loadCompanyData();
       }
     } catch (error) {
       console.error('Failed to reject invitation:', error);
       toast.error('Failed to reject representative request');
     } finally {
       setLoadingInvitations(false);
     }
   }

   // Load organization membership status from CompanyStaff
   async function loadMembershipStatus() {
     try {
       setLoadingMembership(true);
       // Get user's company staff relationships
       const response = await client.get('/company/staff/my-memberships');
       setMembershipStatus(response.data.memberships || []);
     } catch (error) {
       console.error('Failed to load membership status:', error);
       // Don't show error toast for membership status
     } finally {
       setLoadingMembership(false);
     }
   }

   // Handle organization join request success
   async function handleOrganizationJoinSuccess(request) {
     toast.success('Organization join request sent successfully!');
     // Reload membership status to show any updates
     loadMembershipStatus();
   }

   // Handle leaving organization
   async function handleLeaveOrganization(membershipId) {
     try {
       const response = await client.delete(`/company/staff/membership/${membershipId}`);

       if (response.data) {
         toast.success('Successfully left the organization');
         // Reload membership status to show updates
         loadMembershipStatus();
       }
     } catch (error) {
       console.error('Failed to leave organization:', error);
       toast.error('Failed to leave organization');
     }
   }

   // Handle setting main company
   async function handleSetMainCompany(membershipId) {
     try {
       const response = await client.put(`/company/staff/membership/${membershipId}/set-main`);

       if (response.data) {
         toast.success('Main company set successfully');
         // Reload membership status to show updates
         loadMembershipStatus();
       }
     } catch (error) {
       console.error('Failed to set main company:', error);
       toast.error('Failed to set main company');
     }
   }

   // Handle unsetting main company
   async function handleUnsetMainCompany(membershipId) {
     try {
       const response = await client.put(`/company/staff/membership/${membershipId}/unset-main`);

       if (response.data) {
         toast.success('Main company unset successfully');
         // Reload membership status to show updates
         loadMembershipStatus();
       }
     } catch (error) {
       console.error('Failed to unset main company:', error);
       toast.error('Failed to unset main company');
     }
   }

   // Load organization join requests for companies
   async function loadOrganizationJoinRequests() {
     try {
       setLoadingJoinRequests(true);
       const response = await client.get('/organization/join-requests');
       if (response.data?.requests) {
         setOrganizationJoinRequests(response.data.requests);
       }
     } catch (error) {
       console.error('Failed to load organization join requests:', error);
       // Don't show error toast for join requests
     } finally {
       setLoadingJoinRequests(false);
     }
   }

   // Load pending requests count
   async function loadPendingRequestsCount() {
     try {
       const response = await client.get('/organization/join-requests/pending/count');
       if (response.data?.count !== undefined) {
         setPendingRequestsCount(response.data.count);
       }
     } catch (error) {
       console.error('Failed to load pending requests count:', error);
     }
   }

   // Handle approving organization join request
   async function handleApproveJoinRequest(requestId) {
     try {
       const response = await client.put(`/organization/join-requests/${requestId}/approve`);

       if (response.data) {
         toast.success('Join request approved successfully!');
         // Reload join requests and pending count
         loadOrganizationJoinRequests();
         loadPendingRequestsCount();
         // Also reload staff data to show the new member
         loadCompanyData();
       }
     } catch (error) {
       console.error('Failed to approve join request:', error);
       toast.error('Failed to approve join request');
     }
   }

   // Handle rejecting organization join request
   async function handleRejectJoinRequest(requestId) {
     try {
       const response = await client.put(`/organization/join-requests/${requestId}/reject`);

       if (response.data) {
         toast.success('Join request rejected');
         // Reload join requests and pending count
         loadOrganizationJoinRequests();
         loadPendingRequestsCount();
       }
     } catch (error) {
       console.error('Failed to reject join request:', error);
       toast.error('Failed to reject join request');
     }
   }

   // Load job applications for companies
   async function loadJobApplications() {
     try {
       setLoadingApplications(true);
       const response = await client.get('/profile/job-applications');
       if (response.data?.applications) {
         setJobApplications(response.data.applications);
       }
     } catch (error) {
       console.error('Failed to load job applications:', error);
       // Don't show error toast for applications
     } finally {
       setLoadingApplications(false);
     }
   }

   // Load event registrations for companies
   async function loadEventRegistrations() {
     try {
       setLoadingEvents(true);
       const response = await client.get('/profile/event-registrations');
       if (response.data?.registrations) {
         setEventRegistrations(response.data.registrations);
       }
     } catch (error) {
       console.error('Failed to load event registrations:', error);
       // Don't show error toast for registrations
     } finally {
       setLoadingEvents(false);
     }
   }

   // Load individual job applications
   async function loadIndividualJobApplications() {
     try {
       setLoadingIndividualApplications(true);
       const response = await client.get('/profile/applications/jobs');
       if (response.data?.applications) {
         setIndividualJobApplications(response.data.applications);
       }
     } catch (error) {
       console.error('Failed to load individual job applications:', error);
       // Don't show error toast for applications
     } finally {
       setLoadingIndividualApplications(false);
     }
   }

   // Load individual event registrations
   async function loadIndividualEventRegistrations() {
     try {
       setLoadingIndividualEvents(true);
       const response = await client.get('/profile/applications/events');
       if (response.data?.registrations) {
         setIndividualEventRegistrations(response.data.registrations);
       }
     } catch (error) {
       console.error('Failed to load individual event registrations:', error);
       // Don't show error toast for registrations
     } finally {
       setLoadingIndividualEvents(false);
     }
   }

   // Load my job applications for individuals
   async function loadMyApplications() {
     try {
       setLoadingMyApplications(true);
       const response = await client.get('/profile/applications/jobs');
       if (response.data?.applications) {
         setMyJobApplications(response.data.applications);
       }
     } catch (error) {
       console.error('Failed to load my applications:', error);
     } finally {
       setLoadingMyApplications(false);
     }
   }

   // Load my event registrations for individuals
   async function loadMyEventRegistrations() {
     try {
       setLoadingMyEvents(true);
       const response = await client.get('/profile/applications/events');
       if (response.data?.registrations) {
         setMyEventRegistrations(response.data.registrations);
       }
     } catch (error) {
       console.error('Failed to load my event registrations:', error);
     } finally {
       setLoadingMyEvents(false);
     }
   }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        let userData;
        const { data: catalog } = await getIdentityCatalog();

        if (isAdminEditing && userId) {
          // Admin editing another user
          const { data } = await getUserById(userId);
          userData = {
            user: {
              id: data.id,
              name: data.name,
              email: data.email,
              phone: data.phone,
              nationality: data.nationality,
              country: data.country,
              countryOfResidence: data.countryOfResidence,
              city: data.city,
              accountType: data.accountType,
              avatarUrl: data.avatarUrl
            },
            profile: data.profile || {},
            progress: data.progress || { percent: 0 },
            doIdentityIds: data.identities?.map(i => i.id) || [],
            doCategoryIds: data.categories?.map(c => c.id) || [],
            doSubcategoryIds: data.subcategories?.map(s => s.id) || [],
            doSubsubCategoryIds: data.subsubcategories?.map(s => s.id) || [],
            interestIdentityIds: data.interests?.identities?.map(i => i.id) || [],
            interestCategoryIds: data.interests?.categories?.map(c => c.id) || [],
            interestSubcategoryIds: data.interests?.subcategories?.map(s => s.id) || [],
            interestSubsubCategoryIds: data.interests?.subsubcategories?.map(s => s.id) || []
          };
        } else {
          // User editing their own profile
          const { data } = await getMe();
          userData = data;

          // Load work samples separately
          try {
            const { data: workSamplesData } = await getWorkSamples();
            setWorkSamples(Array.isArray(workSamplesData?.workSamples) ? workSamplesData.workSamples : []);
          } catch (workSampleError) {
            console.error("Failed to load work samples:", workSampleError);
            setWorkSamples([]);
          }
        }

        setMe(userData);
        setIdentities(Array.isArray(catalog?.identities) ? catalog.identities : []);

        // hydrate personal
        const u = userData.user || {};
        const p = userData.profile || {};
        setPersonal({
          name: u.name || "",
          phone: u.phone || "",
          nationality: u.nationality || "",
          country: u.country || "",
          countryOfResidence: u.countryOfResidence || "",
          city: u.city || "",
          birthDate: p.birthDate || "",
          professionalTitle: p.professionalTitle || "",
          about: p.about || "",
          avatarUrl: u.avatarUrl || p.avatarUrl || "",
          // Individual fields
          gender: u.gender || "",
          // Company fields
          otherCountries: Array.isArray(u.otherCountries) ? u.otherCountries : [],
          webpage: u.webpage || "",
        });

        // hydrate professional
        setProfessional({
          experienceLevel: p.experienceLevel || "",
          skills: Array.isArray(p.skills) ? p.skills : [],
          languages: Array.isArray(p.languages) ? p.languages : [],
        });

        // hydrate portfolio
        setPortfolio({
          cvBase64: p.cvBase64 || "",
          cvFileName: p.cvFileName || "",
        });

        // hydrate availability
        setIsOpenToWork(Boolean(p.isOpenToWork));

        // DOES
        setDoIdentityIds(userData.doIdentityIds || []);
        setDoCategoryIds(userData.doCategoryIds || []);
        setDoSubcategoryIds(userData.doSubcategoryIds || []);
        setDoSubsubCategoryIds(userData.doSubsubCategoryIds || []);

        // WANTS
        setWantIdentityIds(userData.interestIdentityIds || []);
        setWantCategoryIds(userData.interestCategoryIds || []);
        setWantSubcategoryIds(userData.interestSubcategoryIds || []);
        setWantSubsubCategoryIds(userData.interestSubsubCategoryIds || []);

        // INDUSTRIES
        setIndustryCategoryIds(userData.industryCategoryIds || []);
        setIndustrySubcategoryIds(userData.industrySubcategoryIds || []);
        setIndustrySubsubCategoryIds(userData.industrySubsubCategoryIds || []);

        // Load industry categories
        const industryResponse = await client.get("/industry-categories/tree");
        setIndustries(Array.isArray(industryResponse.data?.industryCategories)
          ? industryResponse.data.industryCategories : []);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdminEditing, userId]);

  // Load industry categories if not loaded yet
  useEffect(() => {
    if (industries.length === 0 && !loading) {
      (async () => {
        try {
          const industryResponse = await client.get("/api/industry-categories/tree");
          setIndustries(Array.isArray(industryResponse.data?.industryCategories)
            ? industryResponse.data.industryCategories : []);
        } catch (e) {
          console.error("Failed to load industry categories:", e);
        }
      })();
    }
  }, [industries.length, loading]);

  // Use the progress percentage from the API response
  const progress = me?.progress?.percent ?? 0;
  const levels = ["Junior", "Mid", "Senior", "Lead", "Director", "C-level"];

  /* ---------- Save handlers ---------- */
  async function savePersonal() {
    try {
      setSaving(true);
      
      if (isAdminEditing && userId) {
        // Admin editing another user
        const userData = {
          name: personal.name,
          phone: personal.phone,
          nationality: personal.nationality,
          country: personal.country,
          countryOfResidence: personal.countryOfResidence,
          city: personal.city,
          // Individual fields
          gender: personal.gender,
          // Company fields
          otherCountries: personal.otherCountries,
          webpage: personal.webpage,
          profile: {
            birthDate: personal.birthDate,
            professionalTitle: personal.professionalTitle,
            about: personal.about,
            avatarUrl: personal.avatarUrl
          }
        };
        
        await updateUser(userId, userData);
        toast.success("Personal info saved!");
        
        // Refresh user data
        const { data } = await getUserById(userId);
        setMe({
          ...me,
          user: {
            ...me.user,
            name: personal.name,
            phone: personal.phone,
            nationality: personal.nationality,
            country: personal.country,
            countryOfResidence: personal.countryOfResidence,
            city: personal.city
          },
          profile: {
            ...me.profile,
            birthDate: personal.birthDate,
            professionalTitle: personal.professionalTitle,
            about: personal.about,
            avatarUrl: personal.avatarUrl
          },
          progress: data.progress
        });
      } else {
        // User editing their own profile
        const { data } = await updatePersonal(personal);
        setMe(data);
        toast.success("Personal info saved!");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save.");
    } finally { setSaving(false); }
  }

  async function saveProfessional() {
    try {
      setSaving(true);

      if (isAdminEditing && userId) {
        // Admin editing another user
        const userData = {
          profile: {
            experienceLevel: professional.experienceLevel,
            skills: professional.skills,
            languages: professional.languages
          }
        };

        await updateUser(userId, userData);
        toast.success("Professional info saved!");

        // Refresh user data
        const { data } = await getUserById(userId);

        // Update local state with the latest data from the API
        setMe({
          ...me,
          profile: {
            ...me.profile,
            experienceLevel: professional.experienceLevel,
            skills: professional.skills,
            languages: professional.languages
          },
          progress: data.progress
        });
      } else {
        // User editing their own profile
        const { data } = await updateProfessional(professional);
        setMe(data);
        toast.success("Professional info saved!");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save.");
    } finally { setSaving(false); }
  }

  async function savePortfolio() {
    try {
      setSaving(true);

      if (isAdminEditing && userId) {
        // Admin editing another user
        const userData = {
          profile: {
            cvBase64: portfolio.cvBase64,
            cvFileName: portfolio.cvFileName
          }
        };

        await updateUser(userId, userData);
        toast.success("Portfolio info saved!");

        // Refresh user data
        const { data } = await getUserById(userId);

        // Update local state with the latest data from the API
        setMe({
          ...me,
          profile: {
            ...me.profile,
            cvBase64: portfolio.cvBase64,
            cvFileName: portfolio.cvFileName
          },
          progress: data.progress
        });
      } else {
        // User editing their own profile
        const { data } = await updatePortfolio({
          cvBase64: portfolio.cvBase64,
          cvFileName: portfolio.cvFileName
        });
        setMe(data);
        toast.success("Portfolio info saved!");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save.");
    } finally { setSaving(false); }
  }

  async function saveAvailability() {
    try {
      setSaving(true);

      if (isAdminEditing && userId) {
        // Admin editing another user
        const userData = {
          profile: {
            isOpenToWork: isOpenToWork
          }
        };

        await updateUser(userId, userData);
        toast.success("Availability updated!");

        // Refresh user data
        const { data } = await getUserById(userId);

        // Update local state with the latest data from the API
        setMe({
          ...me,
          profile: {
            ...me.profile,
            isOpenToWork: isOpenToWork
          },
          progress: data.progress
        });
      } else {
        // User editing their own profile
        const { data } = await updateAvailability({
          isOpenToWork: !isOpenToWork
        });
        setMe(data);
        toast.success("Availability updated!");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update availability.");
    } finally { setSaving(false); }
  }

  // Work sample functions
  function addSkillTag() {
    const v = (skillTagInput || "").trim();
    if (!v) return;
    setSampleForm(f =>
      f.skillsTags.includes(v) ? f : { ...f, skillsTags: [...f.skillsTags, v] }
    );
    setSkillTagInput("");
  }

  function removeSkillTag(idx) {
    setSampleForm(f => ({ ...f, skillsTags: f.skillsTags.filter((_, i) => i !== idx) }));
  }

  async function handleSampleFiles(files) {
    const arr = Array.from(files || []);
    if (!arr.length) return;

    try {
      const mapped = await Promise.all(
        arr.map(async (file) => {
          const base64url = await fileToDataURL(file);
          return {
            name: attachmentTitle || file.name,
            base64url,
            isImage: isImage(base64url)
          };
        })
      );
      setSampleForm(f => ({ ...f, attachments: [...f.attachments, ...mapped] }));
      setAttachmentTitle("");
    } catch (err) {
      console.error(err);
      toast.error("Some files could not be read.");
    }
  }

  function removeSampleAttachment(idx) {
    setSampleForm(f => ({ ...f, attachments: f.attachments.filter((_, i) => i !== idx) }));
  }

  function startEditingAttachmentTitle(idx) {
    setEditingAttachmentTitle(idx);
  }

  function saveAttachmentTitle(idx, newTitle) {
    if (!newTitle.trim()) return;
    setSampleForm(f => ({
      ...f,
      attachments: f.attachments.map((att, i) =>
        i === idx ? { ...att, name: newTitle.trim() } : att
      )
    }));
    setEditingAttachmentTitle(null);
  }

  function cancelEditingAttachmentTitle() {
    setEditingAttachmentTitle(null);
  }

  function startEditingSample(sample) {
    setEditingSample(sample.id);
    setShowSampleForm(true);
    setSampleForm({
      title: sample.title || "",
      description: sample.description || "",
      projectUrl: sample.projectUrl || "",
      skillsTags: Array.isArray(sample.technologies) ? sample.technologies : [],
      attachments: Array.isArray(sample.attachments) ? sample.attachments : [],
    });
  }

  function cancelEditingSample() {
    setEditingSample(null);
    setSampleForm({
      title: "",
      description: "",
      projectUrl: "",
      skillsTags: [],
      attachments: [],
    });
    setSkillTagInput("");
    setAttachmentTitle("");
    setEditingAttachmentTitle(null);
  }

  async function saveWorkSample() {
    // Validation
    if (!sampleForm.title.trim()) {
      toast.error("Project title is required");
      return;
    }

    try {
      const payload = {
        title: sampleForm.title.trim(),
        description: sampleForm.description.trim() || null,
        projectUrl: sampleForm.projectUrl.trim() || null,
        technologies: sampleForm.skillsTags,
        attachments: sampleForm.attachments,
        isPublic: true
      };

      if (editingSample) {
        // Update existing sample
        await updateWorkSample(editingSample, payload);
        // Refresh work samples
        const { data: workSamplesData } = await getWorkSamples();
        setWorkSamples(Array.isArray(workSamplesData?.workSamples) ? workSamplesData.workSamples : []);
        toast.success("Work sample updated successfully");
      } else {
        // Create new sample
        const { data } = await createWorkSample(payload);
        setWorkSamples(prev => [data.workSample, ...prev]);
        toast.success("Work sample added successfully");
      }

      cancelEditingSample();
      setShowSampleForm(false);
    } catch (error) {
      toast.error("Failed to save work sample");
    }
  }

  // Helper functions (same as CreateServicePage)
  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  function isImage(base64url) {
    return typeof base64url === "string" && base64url.startsWith("data:image");
  }

  // Helper function to check if attachment is image
  function isAttachmentImage(attachment) {
    return attachment && typeof attachment.base64url === "string" && attachment.base64url.startsWith("data:image");
  }

  async function saveDo() {
    try {
      setSaving(true);
      
      if (isAdminEditing && userId) {
        // Admin editing another user - this would require additional backend endpoints
        // for admins to update user taxonomy selections
        toast.error("Admin editing of taxonomy selections is not supported yet.");
      } else {
        // User editing their own profile
        const { data } = await updateDoSelections({
          identityIds: doIdentityIds,
          categoryIds: doCategoryIds,
          subcategoryIds: doSubcategoryIds,
          subsubCategoryIds: doSubsubCategoryIds,
        });
        setMe(data);
        toast.success("Updated what you DO!");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save.");
    } finally { setSaving(false); }
  }

  async function saveInterests() {
    try {
      setSaving(true);

      if (isAdminEditing && userId) {
        // Admin editing another user - this would require additional backend endpoints
        // for admins to update user taxonomy selections
        toast.error("Admin editing of taxonomy selections is not supported yet.");
      } else {
        // User editing their own profile
        const { data } = await updateInterestSelections({
          identityIds: wantIdentityIds,
          categoryIds: wantCategoryIds,
          subcategoryIds: wantSubcategoryIds,
          subsubCategoryIds: wantSubsubCategoryIds,
        });
        setMe(data);
        toast.success("Updated what you're LOOKING FOR!");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save.");
    } finally { setSaving(false); }
  }

  async function saveIndustries() {
    try {
      setSaving(true);

      if (isAdminEditing && userId) {
        // Admin editing another user - this would require additional backend endpoints
        // for admins to update user taxonomy selections
        toast.error("Admin editing of taxonomy selections is not supported yet.");
      } else {
        // User editing their own profile
        const { data } = await updateIndustrySelections({
          industryCategoryIds,
          industrySubcategoryIds,
          industrySubsubCategoryIds,
        });
        setMe(data);
        toast.success("Updated your industries!");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save.");
    } finally { setSaving(false); }
  }

  /* ---------- Relationships (maps) ---------- */
  const getIdentityKey = (iden) => iden.id || `name:${iden.name}`;

  const catToIdentityKeys = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      const ik = getIdentityKey(iden);
      for (const c of iden.categories || []) {
        if (!c?.id) continue;
        m[c.id] = m[c.id] || new Set();
        m[c.id].add(ik);
      }
    }
    return m;
  }, [identities]);

  const subToIdentityKeys = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      const ik = getIdentityKey(iden);
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          if (!s?.id) continue;
          m[s.id] = m[s.id] || new Set();
          m[s.id].add(ik);
        }
      }
    }
    return m;
  }, [identities]);

  const subsubToIdentityKeys = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      const ik = getIdentityKey(iden);
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          for (const x of s.subsubs || []) {
            if (!x?.id) continue;
            m[x.id] = m[x.id] || new Set();
            m[x.id].add(ik);
          }
        }
      }
    }
    return m;
  }, [identities]);

  const subToCat = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          if (s?.id) m[s.id] = c.id;
        }
      }
    }
    return m;
  }, [identities]);

  const subsubToSub = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          for (const x of s.subsubs || []) {
            if (x?.id) m[x.id] = s.id;
          }
        }
      }
    }
    return m;
  }, [identities]);

  const catToAllSubIds = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      for (const c of iden.categories || []) {
        if (!c?.id) continue;
        const subs = (c.subcategories || []).map((s) => s.id).filter(Boolean);
        m[c.id] = Array.from(new Set([...(m[c.id] || []), ...subs]));
      }
    }
    return m;
  }, [identities]);

  const subToAllSubsubIds = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          if (!s?.id) continue;
          const subsubs = (s.subsubs || []).map((x) => x.id).filter(Boolean);
          m[s.id] = Array.from(new Set([...(m[s.id] || []), ...subsubs]));
        }
      }
    }
    return m;
  }, [identities]);

  /* ---------- Helpers: generic toggles ---------- */
  function makeToggleIdentity({ pickIds, setPickIds, setCats, setSubs, setX }) {
    return (identityKey) => {
      setPickIds((prev) => {
        const picked = prev.includes(identityKey) ? prev.filter(x => x !== identityKey) : [...prev, identityKey];
        const stillCovered = (map, id) => {
          const ownersSet = map[id];
          return ownersSet ? picked.some(ik => ownersSet.has(ik)) : false;
        };
        setX(prev => prev.filter(xid => stillCovered(subsubToIdentityKeys, xid)));
        setSubs(prev => prev.filter(sid => stillCovered(subToIdentityKeys, sid)));
        setCats(prev => prev.filter(cid => stillCovered(catToIdentityKeys, cid)));
        return picked;
      });
    };
  }

  function makeToggleCategory({ catIds, setCatIds, setSubIds, setXIds }) {
    return (catId) => {
      if (!catId) return;
      const has = catIds.includes(catId);
      if (has) {
        const subs = catToAllSubIds[catId] || [];
        const xIds = subs.flatMap(sid => subToAllSubsubIds[sid] || []);
        setCatIds(prev => prev.filter(x => x !== catId));
        setSubIds(prev => prev.filter(s => !subs.includes(s)));
        setXIds(prev => prev.filter(x => !xIds.includes(x)));
      } else {
        setCatIds(prev => [...prev, catId]);
      }
    };
  }

  function makeToggleSub({ subIds, setSubIds, setXIds, setCatIds }) {
    return (subId) => {
      if (!subId) return;
      const parentCatId = subToCat[subId];
      const has = subIds.includes(subId);
      if (has) {
        const xIds = subToAllSubsubIds[subId] || [];
        setSubIds(prev => prev.filter(x => x !== subId));
        setXIds(prev => prev.filter(x => !xIds.includes(x)));
      } else {
        if (parentCatId) {
          setCatIds(prev => (prev.includes(parentCatId) ? prev : [...prev, parentCatId]));
        }
        setSubIds(prev => [...prev, subId]);
      }
    };
  }

  function makeToggleSubsub({ setXIds, subIds, setSubIds, setCatIds }) {
    return (xId) => {
      if (!xId) return;
      const parentSubId = subsubToSub[xId];
      const parentCatId = parentSubId ? subToCat[parentSubId] : null;
      setXIds(prev => {
        const has = prev.includes(xId);
        if (has) return prev.filter(x => x !== xId);
        if (parentSubId && !subIds.includes(parentSubId)) setSubIds(p => [...p, parentSubId]);
        if (parentCatId) setCatIds(p => (p.includes(parentCatId) ? p : [...p, parentCatId]));
        return [...prev, xId];
      });
    };
  }

  /* ---------- DOES ---------- */
  const toggleIdentityDo = makeToggleIdentity({
    pickIds: doIdentityIds, setPickIds: setDoIdentityIds,
    setCats: setDoCategoryIds, setSubs: setDoSubcategoryIds, setX: setDoSubsubCategoryIds,
  });
  const toggleCategoryDo = makeToggleCategory({
    catIds: doCategoryIds, setCatIds: setDoCategoryIds,
    setSubIds: setDoSubcategoryIds, setXIds: setDoSubsubCategoryIds,
  });
  const toggleSubDo = makeToggleSub({
    subIds: doSubcategoryIds, setSubIds: setDoSubcategoryIds,
    setXIds: setDoSubsubCategoryIds, setCatIds: setDoCategoryIds,
  });
  const toggleSubsubDo = makeToggleSubsub({
    setXIds: setDoSubsubCategoryIds,
    subIds: doSubcategoryIds, setSubIds: setDoSubcategoryIds,
    setCatIds: setDoCategoryIds,
  });

  /* ---------- WANTS (with limits) ---------- */
  
  // Replace the existing toggleIdentityWant with this:
const toggleIdentityWant = (identityKey) => {
  setWantIdentityIds((prev) => {
    const removing = prev.includes(identityKey);
    const adding   = !removing;

    // Enforce identity limit on add
    if (adding && prev.length >= MAX_WANT_IDENTITIES) return prev;

    const picked = removing ? prev.filter((x) => x !== identityKey) : [...prev, identityKey];

    // Helper: keep an id only if at least one picked identity owns it
    const stillCovered = (map, id) => {
      const owners = map[id];
      return owners ? picked.some((ik) => owners.has(ik)) : false;
    };

    // Prune categories/subcategories/subsubcategories that are no longer covered
    setWantSubsubCategoryIds((prevX) => prevX.filter((xid) => stillCovered(subsubToIdentityKeys, xid)));
    setWantSubcategoryIds((prevS) => prevS.filter((sid) => stillCovered(subToIdentityKeys, sid)));
    setWantCategoryIds((prevC) => prevC.filter((cid) => stillCovered(catToIdentityKeys, cid)));

    return picked;
  });
};


  const toggleCategoryWant = (catId) => {
    setWantCategoryIds(prev => {
      const has = prev.includes(catId);
      if (has) {
        const subs = catToAllSubIds[catId] || [];
        const xs = subs.flatMap(sid => subToAllSubsubIds[sid] || []);
        setWantSubcategoryIds(p => p.filter(id => !subs.includes(id)));
        setWantSubsubCategoryIds(p => p.filter(id => !xs.includes(id)));
        return prev.filter(id => id !== catId);
      } else {
        if (prev.length >= MAX_WANT_CATEGORIES) return prev; // limit
        return [...prev, catId];
      }
    });
  };

  const toggleSubWant = (subId) => {
    const parentCatId = subToCat[subId];
    setWantSubcategoryIds(prev => {
      const has = prev.includes(subId);
      if (has) return prev.filter(x => x !== subId);
      if (parentCatId && !wantCategoryIds.includes(parentCatId)) {
        if (wantCategoryIds.length >= MAX_WANT_CATEGORIES) return prev; // limit
        setWantCategoryIds(p => [...p, parentCatId]);
      }
      return [...prev, subId];
    });
  };

  const toggleSubsubWant = (xId) => {
    const parentSubId = subsubToSub[xId];
    const parentCatId = parentSubId ? subToCat[parentSubId] : null;
    setWantSubsubCategoryIds(prev => {
      const has = prev.includes(xId);
      if (has) return prev.filter(x => x !== xId);
      if (parentSubId && !wantSubcategoryIds.includes(parentSubId)) {
        setWantSubcategoryIds(p => [...p, parentSubId]);
      }
      if (parentCatId && !wantCategoryIds.includes(parentCatId)) {
        if (wantCategoryIds.length >= MAX_WANT_CATEGORIES) return prev; // limit
        setWantCategoryIds(p => [...p, parentCatId]);
      }
      return [...prev, xId];
    });
  };

  /* ---------- INDUSTRY TOGGLE FUNCTIONS ---------- */

  function makeToggleIndustryCategory({ industryCatIds, setIndustryCatIds, setIndustrySubIds, setIndustryXIds, setOpenIndustryCats, setOpenIndustrySubs }) {
    return (industryCatId) => {
      if (!industryCatId) return;
      const has = industryCatIds.includes(industryCatId);
      if (has) {
        const subIds = industries.find(cat => cat.id === industryCatId)?.subcategories?.map(s => s.id) || [];
        const xIds = subIds.flatMap((sid) => industries.find(cat => cat.id === industryCatId)?.subcategories?.find(s => s.id === sid)?.subsubs?.map(x => x.id) || []);
        setIndustryCatIds((prev) => prev.filter((x) => x !== industryCatId));
        setIndustrySubIds((prev) => prev.filter((sid) => !subIds.includes(sid)));
        setIndustryXIds((prev) => prev.filter((x) => !xIds.includes(x)));
        setOpenIndustryCats((prev) => { const next = new Set(prev); next.delete(industryCatId); return next; });
        setOpenIndustrySubs((prev) => { const next = new Set(prev); for (const sid of subIds) next.delete(sid); return next; });
      } else {
        setIndustryCatIds((prev) => [...prev, industryCatId]);
        setOpenIndustryCats((prev) => new Set(prev).add(industryCatId));
      }
    };
  }

  function makeToggleIndustrySub({ industrySubIds, setIndustrySubIds, setIndustryXIds, setOpenIndustrySubs, setIndustryCatIds, setOpenIndustryCats }) {
    return (industrySubId) => {
      if (!industrySubId) return;
      const parentCatId = industries.find(cat => cat.subcategories?.some(s => s.id === industrySubId))?.id;
      const has = industrySubIds.includes(industrySubId);
      if (has) {
        const xIds = industries.find(cat => cat.id === parentCatId)?.subcategories?.find(s => s.id === industrySubId)?.subsubs?.map(x => x.id) || [];
        setIndustrySubIds((prev) => prev.filter((x) => x !== industrySubId));
        setIndustryXIds((prev) => prev.filter((x) => !xIds.includes(x)));
        setOpenIndustrySubs((prev) => { const n = new Set(prev); n.delete(industrySubId); return n; });
      } else {
        if (parentCatId) {
          setIndustryCatIds((prev) => (prev.includes(parentCatId) ? prev : [...prev, parentCatId]));
          setOpenIndustryCats((prev) => new Set(prev).add(parentCatId));
        }
        setIndustrySubIds((prev) => [...prev, industrySubId]);
      }
    };
  }

  function makeToggleIndustrySubsub({ setIndustryXIds, industrySubIds, setIndustrySubIds, setIndustryCatIds, setOpenIndustryCats }) {
    return (industryXId) => {
      if (!industryXId) return;
      const parentSubId = industries.flatMap(cat => cat.subcategories || []).find(s => s.subsubs?.some(x => x.id === industryXId))?.id;
      const parentCatId = parentSubId ? industries.find(cat => cat.subcategories?.some(s => s.id === parentSubId))?.id : null;
      setIndustryXIds((prev) => {
        const has = prev.includes(industryXId);
        if (has) return prev.filter((x) => x !== industryXId);
        if (parentSubId && !industrySubIds.includes(parentSubId)) {
          setIndustrySubIds((p) => [...p, parentSubId]);
        }
        if (parentCatId) {
          setIndustryCatIds((p) => (p.includes(parentCatId) ? p : [...p, parentCatId]));
          setOpenIndustryCats((p) => new Set(p).add(parentCatId));
        }
        return [...prev, industryXId];
      });
    };
  }

  const toggleIndustryCategory = makeToggleIndustryCategory({
    industryCatIds: industryCategoryIds, setIndustryCatIds: setIndustryCategoryIds,
    setIndustrySubIds: setIndustrySubcategoryIds, setIndustryXIds: setIndustrySubsubCategoryIds,
    setOpenIndustryCats: setOpenIndustryCats, setOpenIndustrySubs: setOpenIndustrySubs,
  });

  const toggleIndustrySub = makeToggleIndustrySub({
    industrySubIds: industrySubcategoryIds, setIndustrySubIds: setIndustrySubcategoryIds,
    setIndustryXIds: setIndustrySubsubCategoryIds, setOpenIndustrySubs: setOpenIndustrySubs,
    setIndustryCatIds: setIndustryCategoryIds, setOpenIndustryCats: setOpenIndustryCats,
  });

  const toggleIndustrySubsub = makeToggleIndustrySubsub({
    setIndustryXIds: setIndustrySubsubCategoryIds,
    industrySubIds: industrySubcategoryIds, setIndustrySubIds: setIndustrySubcategoryIds,
    setIndustryCatIds: setIndustryCategoryIds, setOpenIndustryCats: setOpenIndustryCats,
  });

  /* ---------- AUTO-OPEN ON TAB ENTER ---------- */
  const computeOpenFromSelections = (catIds, subIds, xIds) => {
    const cats = new Set(catIds);
    const subs = new Set(subIds);

    // parents from subIds
    for (const sid of subIds) {
      const pc = subToCat[sid];
      if (pc) cats.add(pc);
    }
    // parents from xIds
    for (const xid of xIds) {
      const ps = subsubToSub[xid];
      if (ps) {
        subs.add(ps);
        const pc = subToCat[ps];
        if (pc) cats.add(pc);
      }
    }
    return { cats, subs };
  };

  // Open “DO” sets on entering the DO tab or when selections change
  useEffect(() => {
    if (active !== Tab.DO) return;
    const { cats, subs } = computeOpenFromSelections(
      doCategoryIds, doSubcategoryIds, doSubsubCategoryIds
    );
    setOpenCatsDo(cats);
    setOpenSubsDo(subs);
  }, [active, doCategoryIds, doSubcategoryIds, doSubsubCategoryIds, subToCat, subsubToSub]);

  // Open “WANTS” sets on entering the INTERESTS tab or when selections change
  useEffect(() => {
    if (active !== Tab.INTERESTS) return;
    const { cats, subs } = computeOpenFromSelections(
      wantCategoryIds, wantSubcategoryIds, wantSubsubCategoryIds
    );
    setOpenCatsWant(cats);
    setOpenSubsWant(subs);
  }, [active, wantCategoryIds, wantSubcategoryIds, wantSubsubCategoryIds, subToCat, subsubToSub]);

  // Open “INDUSTRIES” sets on entering the INDUSTRIES tab or when selections change
  useEffect(() => {
    if (active !== Tab.INDUSTRIES) return;
    const cats = new Set(industryCategoryIds);
    const subs = new Set(industrySubcategoryIds);
    setOpenIndustryCats(cats);
    setOpenIndustrySubs(subs);
  }, [active, industryCategoryIds, industrySubcategoryIds]);

  /* ---------- UI ---------- */
  const Loading = () => (
    <div className="min-h-screen grid place-items-center text-brand-700">
      <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"/>
      </svg>
      <span className="ml-2">Loading…</span>
    </div>
  );

  if (loading) return <Loading />;
  if (!me) return null;

  function IdentityGrid({ picked, onToggle, limit }) {
    const reached = typeof limit === "number" && picked.length >= limit;
    return (
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
        {identities.map((iden, i) => {
          const key = getIdentityKey(iden);
          const active = picked.includes(key);
          const disabled = !active && reached;
          return (
            <button
              key={`${i}-${iden.name}`}
              onClick={() => !disabled && onToggle(key)}
              disabled={disabled}
              className={`rounded-xl flex items-center justify-between border px-4 py-3 text-left hover:shadow-soft ${
                active ? "border-brand-700 ring-2 ring-brand-500" : "border-gray-200"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div>
                <div className="font-medium">{iden.name}</div>
                <div className="text-xs text-gray-500">{(iden.categories || []).length} categories</div>
              </div>
              <input type="checkbox" className="h-4 w-4 pointer-events-none" checked={active} readOnly />
            </button>
          );
        })}
      </div>
    );
  }

  function CategoryTree({
    selectedIdentitiesKeys,
    catIds, subIds, xIds,
    openCats, openSubs,
    onToggleCat, onToggleSub, onToggleSubsub,
    setOpenCats, setOpenSubs,
    catLimit,
    ensureCatOpenOnSelect = true,
    ensureSubOpenOnSelect = true,
  }) {
    const hasSubs = (cat) => Array.isArray(cat?.subcategories) && cat.subcategories.length > 0;
    const hasSubsubs = (sc) => Array.isArray(sc?.subsubs) && sc.subsubs.length > 0;
    const reachedCatLimit = typeof catLimit === "number" && catIds.length >= catLimit;

    const selectedIdentities = useMemo(() => {
      const keys = new Set(selectedIdentitiesKeys);
      return identities.filter((iden) => keys.has(getIdentityKey(iden)));
    }, [identities, selectedIdentitiesKeys]);

    if (selectedIdentities.length === 0) {
      return (
        <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">
          Select at least one identity to see categories.
        </div>
      );
    }

    const toggleCatOpen = (catId) => {
      setOpenCats(prev => {
        const n = new Set(prev);
        n.has(catId) ? n.delete(catId) : n.add(catId);
        return n;
      });
    };
    const toggleSubOpen = (subId) => {
      setOpenSubs(prev => {
        const n = new Set(prev);
        n.has(subId) ? n.delete(subId) : n.add(subId);
        return n;
      });
    };

    return (
      <div className="space-y-4">
        {selectedIdentities.map((iden, iIdx) => (
          <div key={`iden-${iIdx}`} className="rounded-xl border">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-t-xl">
              <div className="font-semibold">{iden.name}</div>
              <span className="text-xs text-gray-500">
                {(iden.categories || []).length} categories
              </span>
            </div>

            <div className="px-4 py-4 space-y-3">
              {(iden.categories || []).map((cat, cIdx) => {
                const _hasSubs = hasSubs(cat);
                const catOpen = !!cat.id && openCats.has(cat.id);
                const catSelected = !!cat.id && catIds.includes(cat.id);
                const catDisabled = !!cat.id && !catSelected && reachedCatLimit;

                return (
                  <div key={`cat-${iIdx}-${cIdx}`} className="border rounded-lg">
                    {/* Entire row toggles open/close */}
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                      role="button"
                      aria-expanded={catOpen}
                      onClick={() => cat.id && toggleCatOpen(cat.id)}
                    >
                      <label
                        className={`flex items-center gap-2 ${catDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={catSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (!cat.id) return;
                            if (catDisabled) return;
                            onToggleCat(cat.id);
                            if (ensureCatOpenOnSelect && _hasSubs) {
                              setOpenCats(prev => new Set(prev).add(cat.id));
                            }
                          }}
                          disabled={!cat.id || catDisabled}
                          title={!cat.id ? "Category not found in DB" : (catDisabled ? "Category limit reached" : "")}
                        />
                        <span className="font-medium">{cat.name}</span>
                      </label>

                      {_hasSubs && (
                        <span className={`text-gray-500 transition-transform ${catOpen ? "rotate-180" : ""}`}>▾</span>
                      )}
                    </div>

                    {_hasSubs && catOpen && (
                      <div className="px-4 pb-4 space-y-3">
                        {(cat.subcategories || []).map((sc, sIdx) => {
                          const _hasSubsubs = hasSubsubs(sc);
                          const isOpen = !!sc.id && openSubs.has(sc.id);
                          const isSelected = !!sc.id && subIds.includes(sc.id);

                          const parentSelected = !!cat.id && catIds.includes(cat.id);
                          const subDisabled = !isSelected && !parentSelected && reachedCatLimit;

                          return (
                            <div key={`sub-${iIdx}-${cIdx}-${sIdx}`} className="border rounded-lg">
                              <div
                                className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                                role="button"
                                aria-expanded={isOpen}
                                onClick={() => sc.id && toggleSubOpen(sc.id)}
                              >
                                <label
                                  className={`flex items-center gap-3 ${subDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      if (!sc.id) return;
                                      if (subDisabled) return;
                                      onToggleSub(sc.id);
                                      if (ensureSubOpenOnSelect && _hasSubsubs) {
                                        setOpenSubs(prev => new Set(prev).add(sc.id));
                                      }
                                    }}
                                    disabled={!sc.id || subDisabled}
                                    title={!sc.id ? "Subcategory not found in DB" : (subDisabled ? "Category limit reached" : "")}
                                  />
                                  <span className="font-medium">{sc.name}</span>
                                </label>

                                {_hasSubsubs && (
                                  <span className={`text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                                )}
                              </div>

                              {_hasSubsubs && (isOpen || isSelected) && (
                                <div className="px-4 pb-3">
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {sc.subsubs.map((ss, ssIdx) => {
                                      const parentCatSelected = !!cat.id && catIds.includes(cat.id);
                                      const ssSelected = !!ss.id && xIds.includes(ss.id);
                                      const ssDisabled = !ssSelected && !parentCatSelected && reachedCatLimit;
                                      return (
                                        <label
                                          key={`ss-${iIdx}-${cIdx}-${sIdx}-${ssIdx}`}
                                          className={`inline-flex items-center gap-2 px-2 py-1 border rounded-full text-sm ${ssDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={!!ss.id && ssSelected}
                                            onChange={() => {
                                              if (!ss.id || ssDisabled) return;
                                              onToggleSubsub(ss.id);
                                            }}
                                            disabled={!ss.id || ssDisabled}
                                            title={!ss.id ? "Level-3 not found in DB" : (ssDisabled ? "Category limit reached" : "")}
                                          />
                                          <span>{ss.name}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Industry tree component
  function IndustryTreeStep({
    title, subtitle,
    industryCatIds, industrySubIds, industryXIds,
    openIndustryCats, openIndustrySubs,
    onToggleIndustryCat, onToggleIndustrySub, onToggleIndustrySubsub,
    setOpenIndustryCats, setOpenIndustrySubs,
  }) {
    const hasIndustrySubs = (industryCat) => Array.isArray(industryCat?.subcategories) && industryCat.subcategories.length > 0;
    const hasIndustrySubsubs = (industrySc) => Array.isArray(industrySc?.subsubs) && industrySc.subsubs.length > 0;

    const toggleIndustryCatOpen = (industryCatId) => {
      setOpenIndustryCats(prev => {
        const n = new Set(prev);
        n.has(industryCatId) ? n.delete(industryCatId) : n.add(industryCatId);
        return n;
      });
    };

    const toggleIndustrySubOpen = (industrySubId) => {
      setOpenIndustrySubs(prev => {
        const n = new Set(prev);
        n.has(industrySubId) ? n.delete(industrySubId) : n.add(industrySubId);
        return n;
      });
    };

    return (
      <>
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-gray-600">{subtitle}</p>
        </div>

        <div className="space-y-4">
          {industries.length === 0 ? (
            <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">
              Loading industry categories...
            </div>
          ) : (
            industries.map((industryCat, cIdx) => {
              const _hasSubs = hasIndustrySubs(industryCat);
              const industryCatOpen = !!industryCat.id && openIndustryCats.has(industryCat.id);
              const industryCatSelected = !!industryCat.id && industryCatIds.includes(industryCat.id);

              return (
                <div key={`industry-cat-${cIdx}`} className="rounded-xl border">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-t-xl">
                    <div className="flex items-center gap-2">

                    
                         <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={industryCatSelected}
                        onChange={() => industryCat.id && onToggleIndustryCat(industryCat.id)}
                      />
                      
                    </div>

                       <div className="font-semibold">{industryCat.name}</div>
                  


                    </div>
                  
                    <div className="flex items-center gap-1">
                     
                        <span className="text-xs text-gray-500">
                      {(industryCat.subcategories || []).length} subcategories
                    </span>
                      {_hasSubs && (
                        <button
                          type="button"
                          className="text-gray-500 hover:text-gray-700 ml-auto"
                          aria-expanded={industryCatOpen}
                          onClick={() => industryCat.id && toggleIndustryCatOpen(industryCat.id)}
                        >
                          <span className={`inline-block transition-transform ${industryCatOpen ? "rotate-180" : ""}`}>▾</span>
                        </button>
                      )}

                    </div>
                  </div>

                  <div className={`${ (_hasSubs && industryCatOpen) ? 'px-4 py-4 space-y-3':''}`}>
                 

                    {_hasSubs && industryCatOpen && (
                      <div className="ml-7 space-y-3">
                        {(industryCat.subcategories || []).map((industrySc, sIdx) => {
                          const _hasSubsubs = hasIndustrySubsubs(industrySc);
                          const isOpen = !!industrySc.id && openIndustrySubs.has(industrySc.id);
                          const isSelected = !!industrySc.id && industrySubIds.includes(industrySc.id);

                          return (
                            <div key={`industry-sub-${cIdx}-${sIdx}`} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <label className="flex items-center w-full flex-1 gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 text-brand-600"
                                    checked={isSelected}
                                    onChange={() => industrySc.id && onToggleIndustrySub(industrySc.id)}
                                  />
                                  <span className="font-medium w-full flex flex-1">{industrySc.name}</span>
                                </label>

                                {_hasSubsubs && (
                                  <button
                                    type="button"
                                    onClick={() => industrySc.id && toggleIndustrySubOpen(industrySc.id)}
                                    className="text-gray-500 hover:text-gray-700"
                                    aria-expanded={isOpen}
                                    aria-label={`Toggle ${industrySc.name} sub-items`}
                                  >
                                    <span className={`inline-block transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                                  </button>
                                )}
                              </div>

                              {_hasSubsubs && (isOpen || isSelected) && (
                                <div className="mt-2 flex flex-wrap gap-2 ml-7">
                                  {industrySc.subsubs.map((industrySs, ssIdx) => {
                                    const ssSelected = !!industrySs.id && industryXIds.includes(industrySs.id);
                                    return (
                                      <label
                                        key={`industry-ss-${cIdx}-${sIdx}-${ssIdx}`}
                                        className="inline-flex items-center gap-2 px-2 py-1 border rounded-full text-sm cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={ssSelected}
                                          onChange={() => industrySs.id && onToggleIndustrySubsub(industrySs.id)}
                                        />
                                        <span>{industrySs.name}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </>
    );
  }

  return (
    <div>
      {!isAdminEditing && <Header/>}
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Header + progress */}
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {isCompany ? "Company Profile" : "Profile"}
              </h1>
              <p className="text-gray-500">
                {isCompany
                  ? "Update your company information and preferences"
                  : "Update your information and preferences"}
              </p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div className="font-medium">Completion</div>
              <div>{progress}%</div>
            </div>
          </div>
          <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-3 bg-brand-700 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Availability Status - Compact design with subtle message */}
        {(!isAdminEditing && user?.accountType=="individual") && (
          <div className="mt-4 bg-white rounded-xl shadow-soft p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isOpenToWork ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {isOpenToWork ? "Open to work" : "Not looking for work"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isOpenToWork ? "Available for opportunities" : "Tap to show availability"}
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const newStatus = !isOpenToWork;
                  setIsOpenToWork(newStatus);
                  try {
                    await saveAvailability();
                  } catch (error) {
                    // Revert on error
                    setIsOpenToWork(!newStatus);
                  }
                }}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isOpenToWork
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {saving ? '...' : (isOpenToWork ? 'Close' : 'Open')}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-6 flex gap-2 flex-wrap">
          <button className={`px-4 py-2 rounded-lg border ${active===Tab.PERSONAL ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.PERSONAL)}>
            {isCompany ? "Company Info" : "Personal"}
          </button>
          <button className={`px-4 py-2 rounded-lg border ${active===Tab.PROFESSIONAL ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.PROFESSIONAL)}>
            {isCompany ? "Company Details" : "Professional"}
          </button>
          <button className={`px-4 py-2 rounded-lg border ${active===Tab.PORTFOLIO ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.PORTFOLIO)}>
            {isCompany ? "Company Portfolio" : "Portfolio"}
          </button>
          <button className={`px-4 py-2 rounded-lg border ${active===Tab.DO ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.DO)}>
            {isCompany ? "What We Offer" : "What I DO"}
          </button>
          <button className={`px-4 py-2 rounded-lg border ${active===Tab.INTERESTS ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.INTERESTS)}>
            {isCompany ? "What We're LOOKING FOR" : "What I'm LOOKING FOR"}
          </button>
          <button className={`px-4 py-2 rounded-lg border ${active===Tab.INDUSTRIES ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.INDUSTRIES)}>
            {isCompany ? "Company Industries" : "Industries"}
          </button>
          {isCompany && (
             <>
               <button className={`px-4 py-2 rounded-lg border ${active===Tab.REPRESENTATIVE ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.REPRESENTATIVE)}>
                 Representative
               </button>
               <button className={`px-4 py-2 rounded-lg border ${active===Tab.STAFF ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.STAFF)}>
                 Staff
                 {staff.length > 0 && (
                   <span className="ml-1 text-xs bg-green-500 text-white rounded-full px-1.5 py-0.5">
                     {staff.length}
                   </span>
                 )}
               </button>
               <button className={`px-4 py-2 rounded-lg border ${active===Tab.JOB_APPLICATIONS ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.JOB_APPLICATIONS)}>
                 Job Applications
               </button>
               <button className={`px-4 py-2 rounded-lg border ${active===Tab.EVENT_REGISTRATIONS ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.EVENT_REGISTRATIONS)}>
                 Event Registrations
               </button>
               <button className={`px-4 py-2 rounded-lg border relative ${active===Tab.JOIN_REQUESTS ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.JOIN_REQUESTS)}>
                 Join Requests
                 {pendingRequestsCount > 0 && (
                   <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                     {pendingRequestsCount}
                   </span>
                 )}
               </button>
             </>
           )}
           {!isCompany && (
             <>
               <button className={`px-4 py-2 rounded-lg border ${active===Tab.APPLICATIONS ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.APPLICATIONS)}>
                 My Applications
               </button>
               <button className={`px-4 py-2 rounded-lg border ${active===Tab.EVENTS ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.EVENTS)}>
                 My Events
               </button>
               <button className={`px-4 py-2 rounded-lg border ${active===Tab.ORGANIZATIONS ? "bg-brand-700 text-white border-brand-700" : "bg-white border-gray-200"}`} onClick={() => setActive(Tab.ORGANIZATIONS)}>
                 Organizations
               </button>
             </>
           )}
        </div>

        <div className="mt-4 bg-white rounded-2xl shadow-soft p-5">
          {/* PERSONAL */}
          {active === Tab.PERSONAL && (
            <div className="space-y-4">
              <ProfilePhoto onChange={(base64)=>setPersonal({ ...personal, avatarUrl: base64 })} avatarUrl={personal.avatarUrl}/>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {isCompany ? "Company name" : "Full name"}
                  </label>
                  <input className="w-full border rounded-lg px-3 py-2" value={personal.name}
                         onChange={e=>setPersonal({...personal, name:e.target.value})}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input disabled={!isAdminEditing} className={`w-full ${!isAdminEditing ? 'opacity-50 pointer-events-none':''} border rounded-lg px-3 py-2 bg-gray-50`} value={me?.user?.email || ""} readOnly/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input onWheel={e => e.currentTarget.blur()} type="number" className="w-full border rounded-lg px-3 py-2" value={personal.phone}
                         onChange={e=>setPersonal({...personal, phone:e.target.value})}/>
                </div>
               {!isCompany && <div>
                  <label className="block text-sm font-medium mb-1">Birth date</label>
                  <input  type="date" className="w-full border rounded-lg px-3 py-2" value={personal.birthDate || ""}
                         onChange={e=>setPersonal({...personal, birthDate:e.target.value})}/>
                </div>}

                <div>
                  <label className="block text-sm font-medium mb-1">Nationality</label>
                  <select value={personal.nationality} onChange={e=>setPersonal({...personal, nationality:e.target.value})}
                          className="w-full border rounded-lg px-3 py-2">
                    <option value="">Select</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Country of residence</label>
                  <select value={personal.countryOfResidence} onChange={e=>setPersonal({...personal, countryOfResidence:e.target.value})}
                          className="w-full border rounded-lg px-3 py-2">
                    <option value="">Select</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Country (birth)</label>
                  <select value={personal.country} onChange={e=>setPersonal({...personal, country:e.target.value})}
                          className="w-full border rounded-lg px-3 py-2">
                    <option value="">Select</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input className="w-full border rounded-lg px-3 py-2" value={personal.city}
                         onChange={e=>setPersonal({...personal, city:e.target.value})}/>
                </div>

                {/* Individual-specific fields */}
                {isCompany ? (
                  <>
                    {/* Company Website */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Company Website</label>
                      <input
                        type="url"
                        className="w-full border rounded-lg px-3 py-2"
                        value={personal.webpage}
                        onChange={e=>setPersonal({...personal, webpage:e.target.value})}
                        placeholder="https://www.yourcompany.com"
                      />
                    </div>

                    {/* Other Countries of Operations */}
                    <div className="md:col-span-2 space-y-3">
                      <label className="block text-sm font-medium mb-1">
                        Other Countries of Operations (Branches)
                      </label>

                      {/* Selected Countries Chips */}
                      {personal.otherCountries.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {personal.otherCountries.map((country) => (
                            <div
                              key={country}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-brand-100 text-brand-800 rounded-full text-sm"
                            >
                              <span>{country}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setPersonal(prev => ({
                                    ...prev,
                                    otherCountries: prev.otherCountries.filter(c => c !== country)
                                  }));
                                }}
                                className="text-brand-600 hover:text-brand-800"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Country Selector */}
                      <div className="relative">
                        <select
                          value=""
                          onChange={(e) => {
                            const selectedCountry = e.target.value;
                            if (selectedCountry && !personal.otherCountries.includes(selectedCountry)) {
                              setPersonal(prev => ({
                                ...prev,
                                otherCountries: [...prev.otherCountries, selectedCountry]
                              }));
                            }
                            e.target.value = ""; // Reset select
                          }}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          <option value="" disabled>Add a country...</option>
                          {COUNTRIES
                            .filter(country => !personal.otherCountries.includes(country))
                            .map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500">
                        Select countries where your company has branches or operations
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Gender */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Gender</label>
                      <select
                        value={personal.gender}
                        onChange={e=>setPersonal({...personal, gender:e.target.value})}
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="" disabled>Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    {isCompany ? "Company description/type" : "Professional title"}
                  </label>
                  <input className="w-full border rounded-lg px-3 py-2" value={personal.professionalTitle}
                         onChange={e=>setPersonal({...personal, professionalTitle:e.target.value})}
                         placeholder={isCompany ? "e.g., Venture Capital Firm, Technology Startup" : "e.g., Software Engineer, Marketing Specialist"}/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    {isCompany ? "About the company" : "About you"}
                  </label>
                  <textarea className="w-full border rounded-lg px-3 py-2" rows="4" value={personal.about}
                            onChange={e=>setPersonal({...personal, about:e.target.value})}
                            placeholder={isCompany
                              ? "Describe your company, its mission, and focus areas..."
                              : "Tell others about yourself, your background, and interests..."}/>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button disabled={saving} onClick={savePersonal} className="px-4 py-2 rounded-xl bg-brand-700 text-white">Save</button>
              </div>
            </div>
          )}

          {/* PROFESSIONAL */}
          {active === Tab.PROFESSIONAL && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {isCompany ? "Company size/stage" : "Experience level"}
                  </label>
                  <select className="w-full border rounded-lg px-3 py-2"
                          value={professional.experienceLevel}
                          onChange={e=>setProfessional(p=>({ ...p, experienceLevel: e.target.value }))}>
                    <option value="">Select</option>
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isCompany ? "Company expertise" : "Skills"}
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {professional.skills.map((s,i)=>(
                    <span key={i} className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 rounded-full px-3 py-1 text-sm">
                      {s}
                      <button onClick={()=>setProfessional(p=>({ ...p, skills: p.skills.filter((_,idx)=>idx!==i) }))}>×</button>
                    </span>
                  ))}
                </div>
                <input className="w-full border rounded-lg px-3 py-2" placeholder="Type a skill and press Enter"
                       onKeyDown={(e)=>{
                         if (e.key === "Enter") {
                           e.preventDefault();
                           const v = e.currentTarget.value.trim();
                           if (v) setProfessional(p=>({ ...p, skills: Array.from(new Set([...(p.skills||[]), v])) }));
                           e.currentTarget.value = "";
                         }
                       }}/>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isCompany ? "Working languages" : "Languages"}
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {professional.languages.map((lng,i)=>(
                    <span key={i} className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm">
                      <b>{lng.name}</b> <em className="text-gray-600">{lng.level}</em>
                      <button onClick={()=>setProfessional(p=>({ ...p, languages: p.languages.filter((_,idx)=>idx!==i) }))}>×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input id="lang-name" className="flex-1 border rounded-lg px-3 py-2" placeholder="Language (e.g., English)"/>
                  <select id="lang-level" className="w-40 border rounded-lg px-3 py-2">
                    <option>Basic</option><option>Intermediate</option><option>Advanced</option><option>Native</option>
                  </select>
                  <button
                    className="px-3 py-2 rounded-lg border"
                    onClick={()=>{
                      const name  = document.getElementById("lang-name").value.trim();
                      const level = document.getElementById("lang-level").value;
                      if (!name) return;
                      setProfessional(p=>({ ...p, languages: [...(p.languages||[]), { name, level }] }));
                      document.getElementById("lang-name").value = "";
                    }}>
                    + Add
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button disabled={saving} onClick={saveProfessional} className="px-4 py-2 rounded-xl bg-brand-700 text-white">Save</button>
              </div>
            </div>
          )}

          {/* PORTFOLIO */}
          {active === Tab.PORTFOLIO && (
            <div className="space-y-6">
              {/* CV Upload */}
              <div>
                <h3 className="font-semibold mb-4">
                  {isCompany ? "Company CV/Resume" : "CV/Resume"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Upload CV (PDF, DOC, DOCX)
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        id="cv-upload"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            // Validate file size (max 10MB)
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error("File size must be less than 10MB");
                              return;
                            }

                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const base64 = event.target.result;
                              setPortfolio(p => ({
                                ...p,
                                cvBase64: base64,
                                cvFileName: file.name
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="cv-upload"
                        className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-colors"
                      >
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="mt-1 text-sm text-gray-600">
                            {portfolio.cvFileName ? `Selected: ${portfolio.cvFileName}` : "Click to upload or drag and drop"}
                          </p>
                          <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Samples */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">
                    {isCompany ? "Company Work Samples" : "Work Samples"}
                  </h3>
                  <button
                    onClick={() => setShowSampleForm(true)}
                    className="px-4 py-2 rounded-lg bg-brand-700 text-white hover:bg-brand-800 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors"
                  >
                    Add Work Sample
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Empty state */}
                  {workSamples.length === 0 && !showSampleForm && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No work samples yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Showcase your work by adding projects, case studies, or portfolio pieces.
                      </p>
                      <div className="mt-6">
                        <button
                          onClick={() => setShowSampleForm(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                        >
                          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Your First Work Sample
                        </button>
                      </div>
                    </div>
                  )}

                  {workSamples.map((sample, index) => (
                    <div key={sample.id || index} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-lg">{sample.title}</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditingSample(sample)}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await deleteWorkSample(sample.id);
                                setWorkSamples(prev => prev.filter((_, i) => i !== index));
                                toast.success("Work sample deleted successfully");
                              } catch (error) {
                                toast.error("Failed to delete work sample");
                              }
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {sample.description && (
                        <p className="text-gray-700 mb-3">{sample.description}</p>
                      )}
                      {sample.projectUrl && (
                        <a
                          href={sample.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Project
                        </a>
                      )}
                      {sample.technologies && sample.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {sample.technologies.map((tech, techIndex) => (
                            <span key={techIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Attachments */}
                      {sample.attachments && sample.attachments.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Attachments</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {sample.attachments.map((attachment, attIndex) => (
                              <div key={attIndex} className="flex items-center gap-3 border rounded-lg p-3 bg-gray-50">
                                <div className="h-10 w-10 rounded-md bg-gray-100 overflow-hidden grid place-items-center">
                                  {isAttachmentImage(attachment) ? (
                                    <img src={attachment.base64url} alt={attachment.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <span className="text-xs text-gray-500">DOC</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="truncate text-sm font-medium">{attachment.name}</div>
                                  <div className="text-[11px] text-gray-500 truncate">
                                    {isAttachmentImage(attachment) ? "Image" : "Document"}
                                  </div>
                                </div>
                                <a
                                  href={attachment.base64url}
                                  download={attachment.name}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="Download"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add/Edit work sample */}
                  {showSampleForm && (
                    <div className="border rounded-lg p-6 bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-lg">
                          {editingSample ? "Edit Work Sample" : "Add New Work Sample"}
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            cancelEditingSample();
                            setShowSampleForm(false);
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="Close"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">
                          Project/Sample Title
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter project title"
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          value={sampleForm.title}
                          onChange={(e) => setSampleForm(f => ({ ...f, title: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                          placeholder="Describe your project"
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          rows="3"
                          value={sampleForm.description}
                          onChange={(e) => setSampleForm(f => ({ ...f, description: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Project URL</label>
                        <input
                          type="url"
                          placeholder="https://example.com"
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          value={sampleForm.projectUrl}
                          onChange={(e) => setSampleForm(f => ({ ...f, projectUrl: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Skills & Tags</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={skillTagInput}
                            onChange={(e) => setSkillTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addSkillTag();
                              }
                            }}
                            placeholder="Add skills (e.g., JavaScript, Marketing, Design)"
                            className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={addSkillTag}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700"
                            aria-label="Add skill"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                            Add
                          </button>
                        </div>

                        {sampleForm.skillsTags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {sampleForm.skillsTags.map((s, idx) => (
                              <span
                                key={`${s}-${idx}`}
                                className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs border border-brand-100"
                              >
                                {s}
                                <button
                                  type="button"
                                  className="text-gray-500 hover:text-gray-700"
                                  onClick={() => removeSkillTag(idx)}
                                  title="Remove"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Attachments */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Portfolio Samples (Optional)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-600">
                          <div className="mb-2">
                            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          Upload images or documents showcasing your work
                          <div className="mt-3 flex gap-2 justify-center">
                            <input
                              type="text"
                              placeholder="File title (optional)"
                              className="flex-1 max-w-xs border rounded-lg px-3 py-2 text-sm"
                              value={attachmentTitle}
                              onChange={(e) => setAttachmentTitle(e.target.value)}
                            />
                            <input
                              type="file"
                              multiple
                              accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                              className="hidden"
                              id="sample-files"
                              onChange={(e) => handleSampleFiles(e.target.files)}
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById("sample-files").click()}
                              className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            >
                              Choose Files
                            </button>
                          </div>

                          {sampleForm.attachments.length > 0 && (
                            <div className="mt-6 grid sm:grid-cols-2 gap-4 text-left">
                              {sampleForm.attachments.map((a, idx) => (
                                <div key={`${a.name}-${idx}`} className="flex items-center gap-3 border rounded-lg p-3">
                                  <div className="h-12 w-12 rounded-md bg-gray-100 overflow-hidden grid place-items-center">
                                    {a.isImage ? (
                                      <img src={a.base64url} alt={a.name} className="h-full w-full object-cover" />
                                    ) : (
                                      <span className="text-xs text-gray-500">DOC</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {editingAttachmentTitle === idx ? (
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={a.name}
                                          onChange={(e) => {
                                            const newName = e.target.value;
                                            setSampleForm(f => ({
                                              ...f,
                                              attachments: f.attachments.map((att, i) =>
                                                i === idx ? { ...att, name: newName } : att
                                              )
                                            }));
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              saveAttachmentTitle(idx, a.name);
                                            } else if (e.key === 'Escape') {
                                              cancelEditingAttachmentTitle();
                                            }
                                          }}
                                          onBlur={() => saveAttachmentTitle(idx, a.name)}
                                          className="flex-1 text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                          autoFocus
                                        />
                                        <button
                                          type="button"
                                          onClick={() => saveAttachmentTitle(idx, a.name)}
                                          className="text-green-600 hover:text-green-800 p-1"
                                          title="Save"
                                        >
                                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={cancelEditingAttachmentTitle}
                                          className="text-gray-600 hover:text-gray-800 p-1"
                                          title="Cancel"
                                        >
                                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="truncate text-sm font-medium flex items-center gap-2">
                                          {a.name}
                                          <button
                                            type="button"
                                            onClick={() => startEditingAttachmentTitle(idx)}
                                            className="text-gray-400 hover:text-gray-600 p-1"
                                            title="Edit title"
                                          >
                                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                          </button>
                                        </div>
                                        <div className="text-[11px] text-gray-500 truncate">Attached</div>
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeSampleAttachment(idx)}
                                    className="p-1 rounded hover:bg-gray-100"
                                    title="Remove"
                                  >
                                    <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM6 9h2v9H6V9Z" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-2 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            cancelEditingSample();
                            setShowSampleForm(false);
                          }}
                          className="px-6 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          className="px-6 py-2 rounded-lg bg-brand-700 text-white hover:bg-brand-800 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors"
                          onClick={saveWorkSample}
                        >
                          {editingSample ? "Update Work Sample" : "Add Work Sample"}
                        </button>
                      </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  disabled={saving}
                  onClick={async () => {
                    // Validate CV upload
                    if (!portfolio.cvBase64) {
                      toast.error("Please upload a CV before saving");
                      return;
                    }

                    await savePortfolio();
                  }}
                  className="px-6 py-2 rounded-xl bg-brand-700 text-white hover:bg-brand-800 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? "Saving..." : "Save Portfolio"}
                </button>
              </div>
            </div>
          )}

          {/* WHAT I DO */}
          {active === Tab.DO && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">
                  {isCompany ? "Company identities (what we DO)" : "Identities (what you DO)"}
                </h3>
                <IdentityGrid picked={doIdentityIds} onToggle={toggleIdentityDo} />
              </div>
              <div>
                <h3 className="font-semibold mb-2">
                  {isCompany ? "Categories (what we DO)" : "Categories (what you DO)"}
                </h3>
                <CategoryTree
                  selectedIdentitiesKeys={doIdentityIds}
                  catIds={doCategoryIds}
                  subIds={doSubcategoryIds}
                  xIds={doSubsubCategoryIds}
                  openCats={openCatsDo}
                  openSubs={openSubsDo}
                  onToggleCat={(id) => {
                    toggleCategoryDo(id);
                    setOpenCatsDo(prev => new Set(prev).add(id));
                  }}
                  onToggleSub={(id) => {
                    toggleSubDo(id);
                    setOpenSubsDo(prev => new Set(prev).add(id));
                  }}
                  onToggleSubsub={toggleSubsubDo}
                  setOpenCats={setOpenCatsDo}
                  setOpenSubs={setOpenSubsDo}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button disabled={saving} onClick={saveDo} className="px-4 py-2 rounded-xl bg-brand-700 text-white">Save</button>
              </div>
            </div>
          )}

          {/* WHAT I’M LOOKING FOR */}
          {active === Tab.INTERESTS && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold mb-2">
                  {isCompany ? "Identities (what we're LOOKING FOR)" : "Identities (what you're LOOKING FOR)"}
                </h3>
                <span className="text-sm text-gray-500">Selected {wantIdentityIds.length}/{MAX_WANT_IDENTITIES}</span>
              </div>
              <IdentityGrid picked={wantIdentityIds} onToggle={toggleIdentityWant} limit={MAX_WANT_IDENTITIES}/>

              <div className="flex items-center justify-between">
                <h3 className="font-semibold mb-2">
                  {isCompany ? "Categories (what we're LOOKING FOR)" : "Categories (what you're LOOKING FOR)"}
                </h3>
                <span className="text-sm text-gray-500">Selected {wantCategoryIds.length}/{MAX_WANT_CATEGORIES}</span>
              </div>
              <CategoryTree
                selectedIdentitiesKeys={wantIdentityIds}
                catIds={wantCategoryIds}
                subIds={wantSubcategoryIds}
                xIds={wantSubsubCategoryIds}
                openCats={openCatsWant}
                openSubs={openSubsWant}
                onToggleCat={(id) => {
                  toggleCategoryWant(id);
                  setOpenCatsWant(prev => new Set(prev).add(id));
                }}
                onToggleSub={(id) => {
                  toggleSubWant(id);
                  setOpenSubsWant(prev => new Set(prev).add(id));
                }}
                onToggleSubsub={toggleSubsubWant}
                setOpenCats={setOpenCatsWant}
                setOpenSubs={setOpenSubsWant}
                catLimit={MAX_WANT_CATEGORIES}
              />

              <div className="flex justify-end gap-3">
                <button disabled={saving} onClick={saveInterests} className="px-4 py-2 rounded-xl bg-brand-700 text-white">Save</button>
              </div>
            </div>
          )}

          {/* INDUSTRIES */}
          {active === Tab.INDUSTRIES && (
            <div className="space-y-6">
              {industries.length === 0 ? (
                <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">
                  Loading industry categories...
                </div>
              ) : (
                <>
                  <IndustryTreeStep
                    title={isCompany ? "Choose your company's industry focus" : "Choose your industry focus"}
                    subtitle={isCompany
                      ? "Select the industries that best represent your company's sector and expertise."
                      : "Select the industries that best represent your professional sector and expertise."
                    }
                    industryCatIds={industryCategoryIds}
                    industrySubIds={industrySubcategoryIds}
                    industryXIds={industrySubsubCategoryIds}
                    openIndustryCats={openIndustryCats}
                    openIndustrySubs={openIndustrySubs}
                    onToggleIndustryCat={toggleIndustryCategory}
                    onToggleIndustrySub={toggleIndustrySub}
                    onToggleIndustrySubsub={toggleIndustrySubsub}
                    setOpenIndustryCats={setOpenIndustryCats}
                    setOpenIndustrySubs={setOpenIndustrySubs}
                  />

                  <div className="flex justify-end gap-3">
                    <button disabled={saving} onClick={saveIndustries} className="px-4 py-2 rounded-xl bg-brand-700 text-white">Save</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* COMPANY REPRESENTATIVE */}
          {active === Tab.REPRESENTATIVE && isCompany && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Company Representative</h3>
                <p className="text-gray-600 mb-4">
                  Select an individual user to act as the authorized representative for your company.
                  They will receive an email request to authorize this relationship.
                </p>

                {/* Incoming Invitations - Requests to be Representative */}
                {incomingInvitations.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3 text-blue-700">Requests to be Representative</h4>
                    <div className="space-y-3">
                      {incomingInvitations.map(incomingInv => (
                        <div key={incomingInv.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                                {incomingInv.company?.avatarUrl ? (
                                  <img
                                    src={incomingInv.company.avatarUrl}
                                    alt={incomingInv.company.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-blue-700 font-medium">
                                    {incomingInv.company?.name?.charAt(0).toUpperCase() || '?'}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{incomingInv.company?.name || 'Unknown Company'}</div>
                                <div className="text-sm text-gray-600">{incomingInv.company?.email || 'No email'}</div>
                                <div className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 inline-block mt-1">
                                  📧 Request to be Representative
                                </div>
                                {incomingInv.createdAt && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Received {new Date(incomingInv.createdAt).toLocaleDateString()}
                                  </div>
                                )}
                                {incomingInv.message && (
                                  <div className="text-xs text-gray-600 mt-1 italic">
                                    "{incomingInv.message}"
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptIncomingInvitation(incomingInv.id)}
                                disabled={loadingInvitations}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                                title="Accept representative request"
                              >
                                {loadingInvitations ? '...' : 'Accept'}
                              </button>
                              <button
                                onClick={() => handleRejectIncomingInvitation(incomingInv.id)}
                                disabled={loadingInvitations}
                                className="px-3 py-1 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
                                title="Reject representative request"
                              >
                                {loadingInvitations ? '...' : 'Reject'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current/Authorized Representative */}
                {currentRepresentative && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3 text-green-700">Current Representative</h4>
                    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                            {currentRepresentative.representative.avatarUrl ? (
                              <img
                                src={currentRepresentative.representative.avatarUrl}
                                alt={currentRepresentative.representative.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-green-700 font-medium">
                                {currentRepresentative.representative.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{currentRepresentative.representative.name}</div>
                            <div className="text-sm text-gray-600">{currentRepresentative.representative.email}</div>
                            {currentRepresentative.representative.professionalTitle && (
                              <div className="text-xs text-gray-500">{currentRepresentative.representative.professionalTitle}</div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <div className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                                ✓ Authorized
                              </div>
                              {currentRepresentative.authorizedAt && (
                                <div className="text-xs text-gray-500">
                                  Authorized {new Date(currentRepresentative.authorizedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowRepresentativeModal(true)}
                            disabled={sendingRepresentativeInvite}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingRepresentativeInvite ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                                </svg>
                                Sending...
                              </>
                            ) : (
                              'Replace'
                            )}
                          </button>
                          <button
                            onClick={handleRemoveRepresentative}
                            className="px-3 py-1 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending Invitations */}
                {pendingInvitations.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3 text-yellow-700">Pending Requests</h4>
                    <div className="space-y-3">
                      {pendingInvitations.map(pendingRep => {
                        const user = pendingRep.representative || pendingRep.invitedUser;
                        return (
                          <div key={pendingRep.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
                                  {user?.avatarUrl ? (
                                    <img
                                      src={user.avatarUrl}
                                      alt={user.name}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-yellow-700 font-medium">
                                      {user?.name?.charAt(0).toUpperCase() || '?'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{user?.name || 'Unknown User'}</div>
                                  <div className="text-sm text-gray-600">{user?.email || 'No email'}</div>
                                  <div className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 inline-block mt-1">
                                    ⏳ Awaiting Authorization
                                  </div>
                                  {pendingRep.createdAt && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Sent {new Date(pendingRep.createdAt).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleResendInvitation(pendingRep.id)}
                                  disabled={loadingInvitations}
                                  className="px-3 py-1 border border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50 disabled:opacity-50"
                                  title="Resend invitation"
                                >
                                  {loadingInvitations ? '...' : 'Resend'}
                                </button>
                                <button
                                  onClick={() => handleCancelInvitation(pendingRep.id)}
                                  disabled={loadingInvitations}
                                  className="px-3 py-1 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
                                  title="Cancel invitation"
                                >
                                  {loadingInvitations ? '...' : 'Cancel'}
                                </button>
                                <button
                                  onClick={() => setShowRepresentativeModal(true)}
                                  disabled={sendingRepresentativeInvite}
                                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {sendingRepresentativeInvite ? (
                                    <>
                                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                                      </svg>
                                      Sending...
                                    </>
                                  ) : (
                                    'Change'
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Select Representative Button */}
                {!currentRepresentative && pendingInvitations.length === 0 && (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Representative Selected</h3>
                    <p className="text-gray-500 mb-4">
                      Select an individual user to act as your company's authorized representative.
                    </p>
                    <button
                      onClick={() => setShowRepresentativeModal(true)}
                      disabled={sendingRepresentativeInvite}
                      className="px-4 py-2 bg-brand-700 text-white rounded-lg hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingRepresentativeInvite ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        'Select Representative'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COMPANY STAFF */}
          {active === Tab.STAFF && isCompany && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">Company Staff</h3>
                  <p className="text-gray-600 text-sm">
                    Manage team members who have access to company features
                  </p>
                </div>
                <button
                  onClick={() => setShowStaffModal(true)}
                  disabled={sendingStaffInvite}
                  className="px-4 py-2 bg-brand-700 text-white rounded-lg hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingStaffInvite ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Invite Staff Member'
                  )}
                </button>
              </div>

              <div className="space-y-3">
                {staff.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Invite team members to join your company.
                    </p>
                  </div>
                ) : (
                  staff.map(member => (
                    <div key={member.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            {member.staff.avatarUrl ? (
                              <img
                                src={member.staff.avatarUrl}
                                alt={member.staff.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-600 font-medium">
                                {member.staff.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{member.staff.name}</div>
                            <div className="text-sm text-gray-500">{member.staff.email}</div>
                            <div className="text-xs text-gray-400">
                              Role: {editingStaff === member.id ? (
                                <input
                                  type="text"
                                  value={editingRole}
                                  onChange={(e) => setEditingRole(e.target.value)}
                                  className="ml-1 px-2 py-1 border rounded text-sm"
                                  placeholder="Enter role"
                                />
                              ) : (
                                member.role
                              )}
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              Status: {member.status}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {editingStaff === member.id ? (
                            <>
                              <button
                                onClick={() => handleUpdateStaffRole(member.staffId, editingRole)}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditingStaff}
                                className="px-3 py-1 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditingStaff(member)}
                                className="px-3 py-1 border border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleRemoveStaff(member.staffId)}
                                className="px-3 py-1 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* JOB APPLICATIONS */}
          {active === Tab.JOB_APPLICATIONS && isCompany && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Job Applications</h3>
                <p className="text-gray-600 mb-4">
                  View and manage applications for your job postings, ranked by similarity to your requirements.
                </p>

                {loadingApplications ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading applications...</p>
                  </div>
                ) : jobApplications.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      When candidates apply to your jobs, their applications will appear here ranked by match quality.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobApplications.map((application, index) => (
                      <div key={application.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              {application.applicant?.avatarUrl ? (
                                <img
                                  src={application.applicant.avatarUrl}
                                  alt={application.applicant.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-600 font-medium">
                                  {application.applicant?.name?.charAt(0).toUpperCase() || '?'}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{application.applicant?.name || 'Unknown Applicant'}</div>
                              <div className="text-sm text-gray-600">{application.applicant?.email || 'No email'}</div>
                              <div className="text-xs text-gray-500">
                                Applied to: {application.job?.title || 'Unknown Job'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              application.similarityScore >= 80 ? 'bg-green-100 text-green-800' :
                              application.similarityScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {application.similarityScore}% match
                            </div>
                            <div className="text-xs text-gray-500">
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                        {application.coverLetter && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Cover Letter</h4>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {application.coverLetter}
                            </p>
                          </div>
                        )}
                        {application.similarity && application.similarity.matches && (
                          <div className="mb-3 hidden">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Matching Categories</h4>
                            <div className="flex flex-wrap gap-1">
                              {application.similarity.matches.categories.map(cat => (
                                <span key={cat.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                  {cat.name}
                                </span>
                              ))}
                              {application.similarity.matches.subcategories.map(sub => (
                                <span key={sub.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                  {sub.name}
                                </span>
                              ))}
                              {application.similarity.matches.subsubcategories.map(subsub => (
                                <span key={subsub.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                  {subsub.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {application.job?.coverImageBase64 && (
                          <div className="mb-3 hidden">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Job Cover Image</h4>
                            <div className="w-full max-w-xs">
                              <img
                                src={application.job.coverImageBase64}
                                alt="Job cover"
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            Applied {new Date(application.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.open(`/profile/${application.applicant.id}`, '_blank')}
                              className="px-3 py-1 border border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={() => window.open(`/messages?userId=${application.applicant.id}`, '_blank')}
                              className="px-3 py-1 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700"
                            >
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EVENT REGISTRATIONS */}
          {active === Tab.EVENT_REGISTRATIONS && isCompany && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Event Registrations</h3>
                <p className="text-gray-600 mb-4">
                  View and manage registrations for your events, ranked by similarity to your target audience.
                </p>

                {loadingEvents ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading registrations...</p>
                  </div>
                ) : eventRegistrations.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      When attendees register for your events, they will appear here ranked by audience match.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {eventRegistrations.map((registration, index) => (
                      <div key={registration.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              {registration.registrant?.avatarUrl ? (
                                <img
                                  src={registration.registrant.avatarUrl}
                                  alt={registration.registrant.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-600 font-medium">
                                  {registration.registrant?.name?.charAt(0).toUpperCase() || '?'}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{registration.registrant?.name || 'Unknown Attendee'}</div>
                              <div className="text-sm text-gray-600">{registration.registrant?.email || 'No email'}</div>
                              <div className="text-xs text-gray-500">
                                Event: {registration.event?.title || 'Unknown Event'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              registration.similarityScore >= 80 ? 'bg-green-100 text-green-800' :
                              registration.similarityScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {registration.similarityScore}% match
                            </div>
                            <div className="text-xs text-gray-500">
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            Registered {new Date(registration.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.open(`/profile/${registration.attendee.id}`, '_blank')}
                              className="px-3 py-1 border border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={() => window.open(`/messages?userId=${registration.attendee.id}`, '_blank')}
                              className="px-3 py-1 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700"
                            >
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ORGANIZATION JOIN REQUESTS */}
          {active === Tab.JOIN_REQUESTS && isCompany && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Organization Join Requests</h3>
                <p className="text-gray-600 mb-4">
                  Review and manage requests from individuals who want to join your organization.
                </p>

                {loadingJoinRequests ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading join requests...</p>
                  </div>
                ) : organizationJoinRequests.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No join requests yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      When individuals request to join your organization, they will appear here for review.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {organizationJoinRequests.map(request => (
                      <div key={request.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              {request.user?.avatarUrl ? (
                                <img
                                  src={request.user.avatarUrl}
                                  alt={request.user.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-600 font-medium">
                                  {request.user?.name?.charAt(0).toUpperCase() || '?'}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{request.user?.name || 'Unknown User'}</div>
                              <div className="text-sm text-gray-600">{request.user?.email || 'No email'}</div>
                              {request.message && (
                                <div className="text-xs text-gray-600 mt-1 italic">
                                  "{request.message}"
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <div className={`text-xs px-2 py-1 rounded-full ${
                                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {request.status === 'pending' ? '⏳ Pending Review' :
                                   request.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                                </div>
                                {request.createdAt && (
                                  <div className="text-xs text-gray-500">
                                    Requested {new Date(request.createdAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {request.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveJoinRequest(request.id)}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectJoinRequest(request.id)}
                                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {request.status === 'approved' && (
                              <div className="text-sm text-green-600 font-medium">
                                Member Added
                              </div>
                            )}
                            {request.status === 'rejected' && (
                              <div className="text-sm text-red-600 font-medium">
                                Request Rejected
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MY APPLICATIONS */}
          {active === Tab.APPLICATIONS && !isCompany && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">My Job Applications</h3>
                <p className="text-gray-600 mb-4">
                  View your job applications, ranked by similarity to the job requirements.
                </p>

                {loadingMyApplications ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading applications...</p>
                  </div>
                ) : myJobApplications.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      When you apply to jobs, your applications will appear here ranked by match quality.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myJobApplications.map((application, index) => (
                      <div key={application.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              {application.job?.postedBy?.avatarUrl ? (
                                <img
                                  src={application.job.postedBy.avatarUrl}
                                  alt={application.job.postedBy.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-600 font-medium">
                                  {application.job?.postedBy?.name?.charAt(0).toUpperCase() || '?'}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{application.job?.postedBy?.name || 'Unknown Company'}</div>
                              <div className="text-sm text-gray-600">{application.job?.title || 'Unknown Job'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              application.similarity.percentage >= 80 ? 'bg-green-100 text-green-800' :
                              application.similarity.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {application.similarity.percentage}% match
                            </div>
                            <div className="text-xs text-gray-500">
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                        {application.coverLetter && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Cover Letter</h4>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {application.coverLetter}
                            </p>
                          </div>
                        )}
                        {application.similarity && application.similarity.matches && (
                          <div className="mb-3 hidden">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Matching Categories</h4>
                            <div className="flex flex-wrap gap-1">
                              {application.similarity.matches.categories.map(cat => (
                                <span key={cat.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                  {cat.name}
                                </span>
                              ))}
                              {application.similarity.matches.subcategories.map(sub => (
                                <span key={sub.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                  {sub.name}
                                </span>
                              ))}
                              {application.similarity.matches.subsubcategories.map(subsub => (
                                <span key={subsub.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                  {subsub.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {application.job?.coverImageBase64 && (
                          <div className="mb-3 hidden">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Job Cover Image</h4>
                            <div className="w-full max-w-xs">
                              <img
                                src={application.job.coverImageBase64}
                                alt="Job cover"
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            Applied {new Date(application.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.open(`/profile/${application.job.postedBy.id}`, '_blank')}
                              className="px-3 py-1 border border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50"
                            >
                              View Company
                            </button>
                            <button
                              onClick={() => window.open(`/messages?userId=${application.job.postedBy.id}`, '_blank')}
                              className="px-3 py-1 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700"
                            >
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MY EVENTS */}
          {active === Tab.EVENTS && !isCompany && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">My Event Registrations</h3>
                <p className="text-gray-600 mb-4">
                  View your event registrations, ranked by similarity to the event audience.
                </p>

                {loadingMyEvents ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading registrations...</p>
                  </div>
                ) : myEventRegistrations.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      When you register for events, they will appear here ranked by audience match.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myEventRegistrations.map((registration, index) => (
                      <div key={registration.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              {registration.event?.organizer?.avatarUrl ? (
                                <img
                                  src={registration.event.organizer.avatarUrl}
                                  alt={registration.event.organizer.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-600 font-medium">
                                  {registration.event?.organizer?.name?.charAt(0).toUpperCase() || '?'}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{registration.event?.organizer?.name || 'Unknown Organizer'}</div>
                              <div className="text-sm text-gray-600">{registration.event?.title || 'Unknown Event'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              registration.similarity.percentage >= 80 ? 'bg-green-100 text-green-800' :
                              registration.similarity.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {registration.similarity.percentage}% match
                            </div>
                            <div className="text-xs text-gray-500">
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            Registered {new Date(registration.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.open(`/profile/${registration.event.organizer.id}`, '_blank')}
                              className="px-3 py-1 border border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50"
                            >
                              View Organizer
                            </button>
                            <button
                              onClick={() => window.open(`/messages?userId=${registration.event.organizer.id}`, '_blank')}
                              className="px-3 py-1 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700"
                            >
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ORGANIZATION MEMBERSHIP */}
          {active === Tab.ORGANIZATIONS && !isCompany && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Organization Membership</h3>
                  <button
                    onClick={() => setShowOrganizationModal(true)}
                    className="px-4 py-2 bg-brand-700 text-white rounded-lg hover:bg-brand-800 text-sm"
                  >
                    {membershipStatus && membershipStatus.length > 0 ? "+ Join Another" : "Join Organization"}
                  </button>
                </div>

                {/* Current Membership Status */}
                {loadingMembership ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading membership status...</p>
                  </div>
                ) : membershipStatus && membershipStatus.length > 0 ? (
                   <div>
                     <h4 className="font-medium mb-3 text-green-700">Current Organizations</h4>
                     <div className="space-y-3">
                       {membershipStatus.map((membership) => (
                         <div key={membership.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center space-x-3">
                               <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center relative">
                                 {membership.company.avatarUrl ? (
                                   <img
                                     src={membership.company.avatarUrl}
                                     alt={membership.company.name}
                                     className="w-12 h-12 rounded-lg object-cover"
                                   />
                                 ) : (
                                   <span className="text-green-700 font-medium">
                                     {membership.company.name.charAt(0).toUpperCase()}
                                   </span>
                                 )}
                                 {membership.isMain && (
                                   <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                                     <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                       <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                     </svg>
                                   </div>
                                 )}
                               </div>
                               <div className="flex-1">
                                 <div className="flex items-center gap-2">
                                   <div className="font-medium">{membership.company.name}</div>
                                   {membership.isMain && (
                                     <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                                       ⭐ Main Company
                                     </span>
                                   )}
                                 </div>
                                 {membership.company.webpage && (
                                   <div className="text-sm text-gray-600">
                                     <a
                                       href={membership.company.webpage}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="text-brand-600 hover:text-brand-800"
                                     >
                                       {membership.company.webpage}
                                     </a>
                                   </div>
                                 )}
                                 {membership.role && (
                                   <div className="text-xs text-gray-500">Role: {membership.role}</div>
                                 )}
                                 <div className="flex items-center gap-2 mt-1">
                                   <div className={`text-xs px-2 py-1 rounded-full ${
                                     membership.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                     membership.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                     'bg-gray-100 text-gray-800'
                                   }`}>
                                     {membership.status === 'confirmed' ? '✓ Confirmed Member' :
                                      membership.status === 'pending' ? '⏳ Pending Confirmation' :
                                      membership.status}
                                   </div>
                                   {membership.joinedAt && (
                                     <div className="text-xs text-gray-500">
                                       Joined {new Date(membership.joinedAt).toLocaleDateString()}
                                     </div>
                                   )}
                                 </div>
                               </div>
                             </div>
                             <div className="flex gap-2">
                               {!membership.isMain ? (
                                 <button
                                   onClick={() => handleSetMainCompany(membership.id)}
                                   className="px-3 py-1 border border-yellow-300 text-yellow-600 rounded-lg text-sm hover:bg-yellow-50"
                                   title="Set as main company"
                                 >
                                   Set as Main
                                 </button>
                               ) : (
                                 <button
                                   onClick={() => handleUnsetMainCompany(membership.id)}
                                   className="px-3 py-1 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                                   title="Unset as main company"
                                 >
                                   Unset Main
                                 </button>
                               )}
                               <button
                                 onClick={() => handleLeaveOrganization(membership.id)}
                                 className="px-3 py-1 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
                               >
                                 Leave Organization
                               </button>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Join an organization to showcase your professional affiliation.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* User Selection Modal for Representative */}
      {showRepresentativeModal && (
        <UserSelectionModal
          isOpen={showRepresentativeModal}
          onClose={() => setShowRepresentativeModal(false)}
          onSelect={handleRepresentativeSelected}
          title="Select Company Representative"
          description="Choose an individual user to act as the authorized representative for your company. They will receive an email request to authorize this relationship."
          accountType="individual"
        />
      )}

      {/* Staff Invitation Modal */}
       {showStaffModal && (
         <StaffInvitationModal
           isOpen={showStaffModal}
           onClose={() => setShowStaffModal(false)}
           onSuccess={handleStaffInvited}
           companyId={me.user.id}
           companyName={me.user.name}
         />
       )}

       {/* Organization Selection Modal */}
       {showOrganizationModal && (
         <OrganizationSelectionModal
           isOpen={showOrganizationModal}
           onClose={() => setShowOrganizationModal(false)}
           onSuccess={handleOrganizationJoinSuccess}
           title="Join Organization"
           description="Select an organization you'd like to join and send a request for approval."
         />
       )}
    </div>
  );
}


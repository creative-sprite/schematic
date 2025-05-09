// components\database\clients\common\useEntityData.jsx
import { useState, useEffect } from "react";

/**
 * Custom hook to fetch entity data and related entities
 */
const useEntityData = (entityType, id) => {
    const [entity, setEntity] = useState(null);
    const [loading, setLoading] = useState(true);

    // Related entities
    const [groups, setGroups] = useState([]);
    const [chains, setChains] = useState([]);
    const [sites, setSites] = useState([]);
    const [contacts, setContacts] = useState([]);

    // For relationship manager
    const [allGroups, setAllGroups] = useState([]);
    const [allChains, setAllChains] = useState([]);
    const [allSites, setAllSites] = useState([]);
    const [allContacts, setAllContacts] = useState([]);

    // Load data on component mount
    useEffect(() => {
        if (!id) {
            console.error(`No ${entityType} ID provided`);
            setLoading(false);
            return;
        }

        fetchData();
    }, [id, entityType]);

    // Fetch entity and related data
    const fetchData = async () => {
        if (!id) return;

        try {
            console.log(`Fetching ${entityType} with ID:`, id);

            // Prepare API URLs
            const entityUrl = `/api/database/clients/${entityType}s/${id}`;
            const groupsUrl = "/api/database/clients/groups";
            const chainsUrl = "/api/database/clients/chains";
            const sitesUrl = "/api/database/clients/sites";
            const contactsUrl = "/api/database/clients/contacts";

            // Log URLs for debugging
            console.log("API URLs:", {
                entityUrl,
                groupsUrl,
                chainsUrl,
                sitesUrl,
                contactsUrl,
            });

            // Fetch all data in parallel
            const [entityRes, groupsRes, chainsRes, sitesRes, contactsRes] =
                await Promise.all([
                    fetch(entityUrl),
                    fetch(groupsUrl),
                    fetch(chainsUrl),
                    fetch(sitesUrl),
                    fetch(contactsUrl),
                ]);

            // Parse JSON responses
            const entityJson = await entityRes.json();
            const groupsJson = await groupsRes.json();
            const chainsJson = await chainsRes.json();
            const sitesJson = await sitesRes.json();
            const contactsJson = await contactsRes.json();

            // If entity data is fetched successfully
            if (entityJson.success) {
                const entityData = entityJson.data;
                setEntity(entityData);

                // Store all entity options for relationship manager
                setAllGroups(groupsJson.success ? groupsJson.data : []);
                setAllChains(chainsJson.success ? chainsJson.data : []);
                setAllSites(sitesJson.success ? sitesJson.data : []);
                setAllContacts(contactsJson.success ? contactsJson.data : []);

                // Process relationships based on entity type
                if (entityType !== "group") {
                    processGroupRelationships(entityData, groupsJson.data);
                }

                if (entityType !== "chain") {
                    processChainRelationships(entityData, chainsJson.data);
                }

                if (entityType !== "site") {
                    processSiteRelationships(entityData, sitesJson.data);
                }

                if (entityType !== "contact") {
                    processContactRelationships(
                        entityData,
                        contactsJson.data,
                        sitesJson.data
                    );
                }
            } else {
                console.error(`Failed to fetch ${entityType}:`, entityJson);
            }
        } catch (error) {
            console.error(`Error fetching ${entityType} data:`, error);
        } finally {
            setLoading(false);
        }
    };

    // Processes group relationships
    const processGroupRelationships = (entityData, allGroupsData) => {
        if (!entityData || !allGroupsData) return;

        // Check for array of groups
        if (entityData.groups && entityData.groups.length > 0) {
            const relatedGroups = allGroupsData.filter((group) =>
                entityData.groups.includes(group._id)
            );
            setGroups(relatedGroups);
        }
        // Check for legacy single group reference
        else if (entityData.group) {
            const relatedGroup = allGroupsData.find(
                (group) => group._id === entityData.group
            );
            if (relatedGroup) setGroups([relatedGroup]);
        }
    };

    // Processes chain relationships
    const processChainRelationships = (entityData, allChainsData) => {
        if (!entityData || !allChainsData) return;

        // Check for array of chains
        if (entityData.chains && entityData.chains.length > 0) {
            const relatedChains = allChainsData.filter((chain) =>
                entityData.chains.includes(chain._id)
            );
            setChains(relatedChains);
        }
        // Check for legacy single chain reference
        else if (entityData.chain) {
            const relatedChain = allChainsData.find(
                (chain) => chain._id === entityData.chain
            );
            if (relatedChain) setChains([relatedChain]);
        }
    };

    // Processes site relationships
    const processSiteRelationships = (entityData, allSitesData) => {
        if (!entityData || !allSitesData) return;

        // Check for array of sites
        if (entityData.sites && entityData.sites.length > 0) {
            const relatedSites = allSitesData.filter((site) =>
                entityData.sites.includes(site._id)
            );
            setSites(relatedSites);
        }
        // Check for legacy single site reference
        else if (entityData.site) {
            const relatedSite = allSitesData.find(
                (site) => site._id === entityData.site
            );
            if (relatedSite) setSites([relatedSite]);
        }
    };

    // Processes contact relationships - more complex because it may need to check both ways
    const processContactRelationships = (
        entityData,
        allContactsData,
        allSitesData
    ) => {
        if (!entityData || !allContactsData) return;

        // For standard contact array
        if (entityData.contacts && entityData.contacts.length > 0) {
            const relatedContacts = allContactsData.filter((contact) =>
                entityData.contacts.includes(contact._id)
            );
            setContacts(relatedContacts);
        }
        // Special case for Site entity - need to check contacts that reference this site
        else if (entityType === "site" && allContactsData) {
            const siteId = entityData._id.toString();
            const relatedContacts = allContactsData.filter((contact) => {
                const inSitesArray =
                    contact.sites && contact.sites.includes(siteId);
                const hasSingleSiteRef = contact.site === siteId;
                return inSitesArray || hasSingleSiteRef;
            });
            setContacts(relatedContacts);
        }
    };

    // Update entity after relationships change
    const handleEntityUpdate = async (updatedEntity) => {
        setEntity(updatedEntity);
        await fetchData(); // Reload all related entities
    };

    // Format relationship options for the RelationshipManager component
    const getRelationshipOptions = () => {
        return {
            groups: Array.isArray(allGroups)
                ? allGroups.map((group) => ({
                      id: group._id,
                      name: group.groupName || `Group ${group._id}`,
                  }))
                : [],
            chains: Array.isArray(allChains)
                ? allChains.map((chain) => ({
                      id: chain._id,
                      name: chain.chainName || `Chain ${chain._id}`,
                  }))
                : [],
            sites: Array.isArray(allSites)
                ? allSites.map((site) => ({
                      id: site._id,
                      name: site.siteName || `Site ${site._id}`,
                  }))
                : [],
            contacts: Array.isArray(allContacts)
                ? allContacts.map((contact) => ({
                      id: contact._id,
                      name:
                          contact.contactFirstName && contact.contactLastName
                              ? `${contact.contactFirstName} ${contact.contactLastName}`
                              : `Contact ${contact._id}`,
                  }))
                : [],
        };
    };

    return {
        entity,
        loading,
        groups,
        chains,
        sites,
        contacts,
        handleEntityUpdate,
        relationshipOptions: getRelationshipOptions(),
        fetchData,
    };
};

export default useEntityData;
